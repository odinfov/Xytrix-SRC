const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
    Modal,
    TextInputComponent,
    TextInputStyle
} = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'lockall',
    category: 'mod',
    aliases: [],
    description: `Lock's all the channels of the server`,
    premium: true,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_CHANNELS')) {
            let error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `You must have \`Manage Channels\` permission to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }
        if (!isSpecialMember && client.util.hasHigher(message.member) == false) {
            let error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `Your highest role must be higher than my highest role to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }

        if (args[0]) {
            const roleId = args[0];
            const role = message.guild.roles.cache.get(roleId);
            
            if (!role) {
                let error = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`Invalid role ID provided. Please provide a valid role ID.`);
                return message.channel.send({ embeds: [error] });
            }

            return await lockChannelsForRole(client, message, roleId, role.name);
        }

        const configEmbed = new MessageEmbed()
            .setColor(client.color)
            .setTitle('🔒 Channel Lock Configuration')
            .setDescription('Choose which role you want to lock channels for:')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`lockall_everyone_${message.author.id}`)
                    .setLabel('Everyone Role')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(`lockall_custom_${message.author.id}`)
                    .setLabel('Choose Role')
                    .setStyle('SECONDARY'),
            );

        const configMessage = await message.channel.send({ embeds: [configEmbed], components: [row] });
        const filter = (interaction) => {
            return interaction.user.id === message.author.id && 
                   (interaction.customId.startsWith('lockall_everyone_') || 
                    interaction.customId.startsWith('lockall_custom_'));
        };

        const collector = configMessage.createMessageComponentCollector({ 
            filter, 
            time: 60000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId.includes('everyone')) {
                await interaction.deferUpdate();
                await lockChannelsForRole(client, message, message.guild.id, '@everyone');
                collector.stop();
            } else if (interaction.customId.includes('custom')) {
                const modal = new Modal()
                    .setCustomId(`lockall_modal_${message.author.id}`)
                    .setTitle('Enter Role ID');

                const roleInput = new TextInputComponent()
                    .setCustomId('role_id_input')
                    .setLabel('Role ID')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Enter the role ID here...')
                    .setRequired(true)
                    .setMaxLength(20);

                const actionRow = new MessageActionRow().addComponents(roleInput);
                modal.addComponents(actionRow);

                await interaction.showModal(modal);
            }
        });

        collector.on('end', async () => {
            row.components.forEach(component => component.setDisabled(true));
            await configMessage.edit({ components: [row] }).catch(() => {});
        });

        const modalFilter = (interaction) => {
            return interaction.customId === `lockall_modal_${message.author.id}` && 
                   interaction.user.id === message.author.id;
        };

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit() || !modalFilter(interaction)) return;

            const roleId = interaction.fields.getTextInputValue('role_id_input');
            const role = message.guild.roles.cache.get(roleId);

            if (!role) {
                let error = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`Invalid role ID provided. Please provide a valid role ID.`);
                return interaction.reply({ embeds: [error], ephemeral: true });
            }

            await interaction.deferReply();
            await lockChannelsForRole(client, message, roleId, role.name, interaction);
        });
    }
};
async function lockChannelsForRole(client, message, roleId, roleName, interaction = null) {
    let locked = 0;
    
    const loadingEmbed = new MessageEmbed()
        .setColor(client.color)
        .setDescription(`🔄 Locking channels for **${roleName}**... Please wait.`);

    let responseMessage;
    if (interaction) {
        responseMessage = await interaction.editReply({ embeds: [loadingEmbed] });
    } else {
        responseMessage = await message.channel.send({ embeds: [loadingEmbed] });
    }

    try {
        for (const channel of message.guild.channels.cache.filter((c) => c.name).values()) {
            if (channel.manageable) {
                try {
                    await channel.permissionOverwrites.edit(roleId, {
                        SEND_MESSAGES: false,
                        reason: `LOCKALL BY ${message.author.tag} (${message.author.id}) - Target Role: ${roleName}`
                    });
                    locked++;
                } catch (error) {
                    if (error.code === 429) {
                        await client.util.handleRateLimit();
                    } else {
                        console.error(`Failed to lock channel ${channel.name}:`, error);
                    }
                }
            }
        }

        const successEmbed = new MessageEmbed()
            .setColor(client.color)
            .setTitle('🔒 Channels Locked Successfully')
            .setDescription(`Successfully **locked** ${locked} channels for **${roleName}**.`)
            .addField('Locked by', message.author.tag, true)
            .addField('Target Role', roleName, true)
            .setTimestamp();

        if (interaction) {
            await interaction.editReply({ embeds: [successEmbed] });
        } else {
            await responseMessage.edit({ embeds: [successEmbed] });
        }

    } catch (error) {
        console.error('Error in lockChannelsForRole:', error);
        
        const errorEmbed = new MessageEmbed()
            .setColor(client.color)
            .setDescription('An error occurred while locking channels.');

        if (interaction) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await responseMessage.edit({ embeds: [errorEmbed] });
        }
    }
}
