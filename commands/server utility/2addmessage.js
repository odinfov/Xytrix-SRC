const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'addmessage',
    aliases: ['addmsg'],
    description: 'Add a specified number of messages to a member’s message count',
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
            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            const messagesToAdd = parseInt(args[1], 10);

            if (!member) {
                return message.channel.send('Please mention a valid member or provide a valid member ID.');
            }

            if (isNaN(messagesToAdd) || messagesToAdd <= 0) {
                return message.channel.send('Please provide a valid number of messages to add.');
            }

            const userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });

            if (!userRecord) {
                return message.channel.send(`${member}, this user doesn't have a message record tracked by the bot yet.`);
            }

           
            userRecord.messages += messagesToAdd;
            await userRecord.save();

            const embed = new MessageEmbed()
                .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: 'Total Messages', value: `**${userRecord.messages}**`, inline: true },
                    { name: 'Added Messages', value: `**${messagesToAdd}**`, inline: true },
                )
                // .setDescription(`Added **${messagesToAdd}** messages to **${member.user.tag}'s** message count.`)
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in `addmessage` command:', err);
            message.channel.send('An error occurred while updating the message count. Please try again later.');
        }
    }
};
