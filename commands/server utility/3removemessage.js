const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'removemessage',
    aliases: ['removemsg'],
    description: 'Remove a specified number of messages from a member’s message count',
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
            const messagesToRemove = parseInt(args[1], 10);

            if (!member) {
                return message.channel.send('Please mention a valid member or provide a valid member ID.');
            }

            if (isNaN(messagesToRemove) || messagesToRemove <= 0) {
                return message.channel.send('Please provide a valid number of messages to remove.');
            }

            const userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });

            if (!userRecord) {
                return message.channel.send(`${member}, this user doesn't have a message record tracked by the bot yet.`);
            }

            
            if (userRecord.messages < messagesToRemove) {
                return message.channel.send(`This user only has **${userRecord.messages}** messages. You cannot remove more than that.`);
            }

            
            userRecord.messages -= messagesToRemove;
            await userRecord.save();

            const embed = new MessageEmbed()
                .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: 'Total Messages', value: `**${userRecord.messages}**`, inline: true },
                    { name: 'Removed Messages', value: `**${messagesToRemove}**`, inline: true },
                )
                // .setDescription(`Removed **${messagesToRemove}** messages to **${member.user.tag}'s** message count.`)
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in `removemessage` command:', err);
            message.channel.send('An error occurred while updating the message count. Please try again later.');
        }
    }
};
