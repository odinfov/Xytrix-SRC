const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const config = require('../../config.json')

module.exports = {
    name: 'mod',
    category: 'security',
    description: 'Set moderator for the server',
    subcommand: ['add', 'remove', 'list', 'reset'],
    premium: false,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && message.guild.memberCount < 30) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Your server must have at least 30 members to use this feature.`
                        )
                ]
            });
        }

        const antinuke = await client.db.get(`${message.guild.id}_antinuke`);
        if (!antinuke) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('Antinuke is not enabled in this server.')
                ]
            });
        }
        if (!isSpecialMember) {
            if (message.author.id !== message.guild.ownerId) {
                const extraOwner = await client.db.get(`extraowner_${message.guild.id}`);
                if (!extraOwner || extraOwner.owner !== message.author.id) {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('You are not authorized to use this command.')
                        ]
                    });
                }
            }
        }

        const subcommand = args[0]?.toLowerCase();
        const member = message.mentions.members.first();
        const guildId = message.guild.id;
        const isPremium = await client.db.get(`sprem_${guildId}`);
        const maxModerators = isPremium ? 20 : 5;

        try {
            switch (subcommand) {
                case 'add': {
                    if (!member) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Please mention a member.')
                            ]
                        });
                    }

                    const modId = member.id;
                    let data = await client.db.get(`moderators_${guildId}`) || { moderators: [] };

                    if (data.moderators.length >= maxModerators) {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription(`The server has reached the maximum limit of ${maxModerators} moderators.`)
                            ]
                        });
                    }                    

                    if (!data.moderators.includes(modId)) {
                        data.moderators.push(modId);
                        await client.db.set(`moderators_${guildId}`, data);

                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(client.color)
                                    .setTitle('IMP NOTE')
                                    .setDescription('```Be careful while adding any user. They will have access to Moderation commands```')
                                    .addField('**MODERATOR ADDED**', `<@${member.user.id}> has been added as a moderator.`)
                                    .setFooter('Xytrix on Top ???')
                            ]
                        });
                    } else {
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('This user is already a moderator.')
                            ]
                        });
                    }
                }

                case 'remove': {
                    const targetId = member ? member.id : args[1]?.replace(/[<@!>]/g, ''); 
                    if (!targetId) {
                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Please mention a member or provide their user ID.');
                        return message.channel.send({ embeds: [embed] });
                    }
                
                    const isValidId = /^\d{17,19}$/.test(targetId);
                    if (!isValidId) {
                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Invalid member ID.');
                        return message.channel.send({ embeds: [embed] });
                    }
                
                    const data = await client.db.get(`moderators_${guildId}`) || { moderators: [] };
                
                    if (!data.moderators.includes(targetId)) {
                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('That member is not a moderator.');
                        return message.channel.send({ embeds: [embed] });
                    }
                
                    data.moderators = data.moderators.filter(id => id !== targetId);
                    await client.db.set(`moderators_${guildId}`, data);
                
                    const embed = new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('IMP NOTE')
                        .setDescription('```Be careful while adding any user. They will have access to Moderation commands```')
                        .addField('**MODERATOR REMOVED**', `User <@${targetId}> has been removed from moderators.`)
                        .setFooter({ text: 'Xytrix on Top ???' });
                    return message.channel.send({ embeds: [embed] });
                }
                
                case 'list': {
                    try {
                        const data = await client.db.get(`moderators_${guildId}`);
                        const allModerators = data?.moderators || [];

                        if (allModerators.length === 0) {
                            return message.channel.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor(client.color)
                                        .setDescription('No moderators found in this server.')
                                ]
                            });
                        }
                        const displayedModerators = isPremium ? allModerators : allModerators.slice(0, maxModerators);
                        
                        let description = '```Be careful while adding any user. They will have access to Moderation commands```';
                        if (!isPremium && allModerators.length > maxModerators) {
                            description += `\n**Note: **Your Premium subscription has expired!\nOnly showing the first ${maxModerators} moderators. Upgrade now to unlock all exclusive features and manage up to 20 moderators.`;
                        }

                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setTitle('List of Moderators')
                            .setDescription(description)
                            .addField('**MODERATORS**', displayedModerators.map(id => `<@${id}>`).join('\n'))
                            .setFooter('Xytrix on Top ???');

                        return message.channel.send({ embeds: [embed] });
                    } catch (err) {
                        console.error(`Error in 'list' subcommand:`, err);
                        return message.channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('An error occurred while processing the command.')
                            ]
                        });
                    }
                }

                case 'reset':
                    {
                        const embed = new MessageEmbed()
                            .setColor(client.color)
                            .setDescription('Are you sure you want to reset the moderator members list?');

                        const row = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId('confirm_reset')
                                    .setLabel('Yes')
                                    .setStyle('DANGER'),
                                new MessageButton()
                                    .setCustomId('cancel_reset')
                                    .setLabel('No')
                                    .setStyle('SECONDARY')
                            );

                        const confirmMessage = await message.channel.send({ embeds: [embed], components: [row] });

                        const filter = (interaction) => ['confirm_reset', 'cancel_reset'].includes(interaction.customId) && interaction.user.id === message.author.id;
                        const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000 });

                        collector.on('collect', async (interaction) => {
                            if (interaction.customId === 'confirm_reset') {
                                await client.db.set(`moderators_${guildId}`, { moderators: [] });
                                const successEmbed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Moderator list has been successfully reset.');
                                await interaction.update({ embeds: [successEmbed], components: [] });
                            } else if (interaction.customId === 'cancel_reset') {
                                const cancelEmbed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('Moderator list reset canceled.');
                                await interaction.update({ embeds: [cancelEmbed], components: [] });
                            }
                            
                            collector.stop('handled');
                        });

                        collector.on('end', (_, reason) => {
                            if (reason === 'time') {
                                const timeoutEmbed = new MessageEmbed()
                                    .setColor(client.color)
                                    .setDescription('No response received. Moderator list reset canceled.');
                                confirmMessage.edit({ embeds: [timeoutEmbed], components: [] });
                            }
                        });
                    }
                    return;
                    
                default: {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription('Invalid subcommand. Use `add`, `remove`, `list` or `reset`.')
                        ]
                    });
                }
            }
        } catch (err) {
            console.error(`Error in command 'mod':`, err);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('An error occurred while processing the command.')
                ]
            });
        }
    }
};
