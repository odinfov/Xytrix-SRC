const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'resetmessages',
    aliases: ['resetmessage', 'resetmsg'],
    description: 'Reset message counts for a specific member or all members in the server',
    category: 'serveru',
    cooldown: 5,
    premium: false,

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
            const User = client.secondDb.model('User', require('../../models/user'));

            if (!args[0]) {
                return message.channel.send('Please specify `@user` to reset a specific user\'s messages or `all` to reset all users in this guild.');
            }

            if (args[0].toLowerCase() === 'all') {
                const result = await User.updateMany(
                    { guild: message.guild.id },
                    { $set: { messages: 0, dailyMessages: 0 } }
                );

                const embed = new MessageEmbed()
                    .setAuthor({ 
                        name: message.guild.name, 
                        iconURL: message.guild.iconURL({ dynamic: true }) 
                    })
                    .setDescription(`**Successfully reset message counts for all users in the server.**`)
                    .setFooter({ 
                        text: `Requested by ${message.author.tag}`, 
                        iconURL: message.author.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp()
                    .setColor(client.color);

                return message.channel.send({ embeds: [embed] });
            }

            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

            if (!member) {
                return message.channel.send('Please mention a valid member or provide a valid member ID.');
            }

            const userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });

            if (!userRecord) {
                return message.channel.send(`${member}, this user doesn't have a message record tracked by the bot yet.`);
            }

            userRecord.messages = 0;
            userRecord.dailyMessages = 0;
            await userRecord.save();

            const embed = new MessageEmbed()
                .setAuthor({ 
                    name: `${member.user.tag}`, 
                    iconURL: member.user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`Successfully reset all the message count for **${member.user.username}**.`)
                .setFooter({
                    text: `Requested by ${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in `resetmessages` command:', err);
            message.channel.send('An error occurred while resetting the messages. Please try again later.');
        }
    }
};
