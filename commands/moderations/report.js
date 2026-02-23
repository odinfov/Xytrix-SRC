const { MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const WEBHOOK_URL = 'v';

module.exports = {
    name: 'report',
    aliases: [],
    description: 'Report an issue',
    category: 'utility',
    cooldown: '30',

    run: async (client, message, args) => {
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('reportButton')
                    .setLabel('Report an issue')
                    .setStyle('SECONDARY'),
            );

        const embed = new MessageEmbed()
            .setColor(client.color)
            .setDescription('Click the button below to report an issue.')

        await message.channel.send({ embeds: [embed], components: [row] });
    }
};

module.exports.handleInteraction = async (client, interaction) => {
    if (interaction.isButton() && interaction.customId === 'reportButton') {
        const modal = new Modal()
            .setCustomId('reportModal')
            .setTitle('Report an Issue')
            .addComponents(
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId('commandName')
                        .setLabel('Command Name')
                        .setStyle('PARAGRAPH')
                        .setPlaceholder('Enter command name that\'s causing the issue')
                        .setRequired(true)
                        .setMaxLength(15),
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId('issueDescription')
                        .setLabel('Describe the Issue')
                        .setStyle('PARAGRAPH')
                        .setPlaceholder('Describe the problem you are facing')
                        .setRequired(true)
                        .setMaxLength(400),
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId('additionalComments')
                        .setLabel('Additional Comments')
                        .setStyle('PARAGRAPH')
                        .setPlaceholder('//Additional comments . . .')
                        .setRequired(false)
                        .setMaxLength(200),
                )
            );

        await interaction.showModal(modal);
        return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'reportModal') {
        const commandName = interaction.fields.getTextInputValue('commandName');
        const issueDescription = interaction.fields.getTextInputValue('issueDescription');
        const additionalComments = interaction.fields.getTextInputValue('additionalComments') || 'None';

        try {
            const guild = interaction.guild;
            const channel = guild.channels.cache.find(channel => channel.type === 'GUILD_TEXT' && channel.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE'));
            
            if (!channel) {
                throw new Error('Bot does not have permission to create invites in any text channel.');
            }

            const reason = `User Reported An Issue`;
            const invite = await channel.createInvite({ maxAge: 86400, maxUses: 10, reason });

            const embed = new MessageEmbed()
                .setTitle("New Issue Reported")
                .setColor(client.color)
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ dynamic: true }), `https://discord.com/users/${interaction.user.id}`)
                .addField("Command Name", commandName, false)
                .addField("Description", issueDescription, false)
                .addField("Additional Comments", additionalComments, false)
                .addField("Reported by", `[${interaction.member.displayName}](https://discord.com/users/${interaction.user.id})`, false)
                .addField("Server", `${interaction.guild.name} (ID: ${interaction.guild.id})`, false)
                .addField("Channel", `${interaction.channel.name} (ID: ${interaction.channel.id})`, false)
                .addField("Server Link", invite ? `[Join ${guild.name}](${invite})` : 'Invite link generation failed', false)
                .setTimestamp();

            await axios.post(WEBHOOK_URL, {
                username: 'Report Bot',
                embeds: [embed.toJSON()]
            });
            await interaction.editReply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Report Submitted Successfully')
                        .setDescription('Thank you for your report. Our team will review it shortly.')
                ]
            });
        } catch (error) {
            console.error('Error sending report:', error);
            try {
                await interaction.editReply({ 
                    content: "There was an error submitting your report. Please try again later."
                });
            } catch (editError) {
                console.error('Could not edit reply:', editError);
            }
        }
    }
};
