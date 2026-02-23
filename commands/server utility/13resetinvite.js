const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'resetinvites',
    aliases: ['resetinvite', 'resetinv'],
    description: 'Reset invites for a specific user or for everyone in the server.',
    category: 'serveru',
    cooldown: 5,

    run: async (client, message, args) => {
        try {
            let isSpecialMember = config.boss.includes(message.author.id);
            if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} You must have \`Administrator\` permissions to use this command.`
                            )
                    ]
                });
            }
            const Invite = client.secondDb.model('Invite', require('../../models/invite'));
            if (args.length === 0) {
                return message.channel.send('Please provide a user or "all" to reset invites.');
            }

            if (args[0] === 'all') {
                const allInvites = await Invite.find({ guildId: message.guild.id });

                if (allInvites.length === 0) {
                    return message.channel.send('There are no invites to reset.');
                }

                for (const invite of allInvites) {
                    invite.joins = 0;
                    invite.leaves = 0;
                    invite.rejoins = 0;
                    await invite.save();
                }

                const embedAll = new MessageEmbed()
                    .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
                    .setDescription('**Successfully reset invite stats for all users in the server.**')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                    .setColor(client.color);

                message.channel.send({ embeds: [embedAll] });

            } else {
                if (args[0] && args[0].match(/<@!?(\d+)>/) && args[0].match(/<@!?(\d+)>/)[1] === client.user.id) {
                    args.shift();
                }
                let userMention = message.mentions.users.first();
                
                if (userMention && userMention.id === client.user.id && message.mentions.users.size > 1) {
                    userMention = Array.from(message.mentions.users.values())[1];
                }
                
                const user = userMention;

                if (!user) {
                    return message.channel.send('Please mention a user to reset their invite stats.');
                }

                const userInvites = await Invite.find({ guildId: message.guild.id, inviterId: user.id });

                if (!userInvites.length) {
                    return message.channel.send(`${user.username} has no invite stats to reset.`);
                }

                for (const invite of userInvites) {
                    invite.joins = 0;
                    invite.leaves = 0;
                    invite.rejoins = 0;
                    await invite.save();
                }

                const embedUser = new MessageEmbed()
                    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ dynamic: true }) })
                    .setDescription(`Successfully reset all invite stats for **${user.username}**.`)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                    .setColor(client.color);

                message.channel.send({ embeds: [embedUser] });
            }
        } catch (err) {
            console.error('Error resetting invite stats:', err);
            message.channel.send('An error occurred while resetting invite stats.');
        }
    }
};
