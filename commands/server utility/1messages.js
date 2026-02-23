const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'messages',
    aliases: ['m'],
    description: 'Check the number of messages a member has sent',
    category: 'serveru',
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const User = client.secondDb.model('User', require('../../models/user'));
            const member = message.mentions.members.first() || message.member;

            const userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });

            if (!userRecord) {
                return message.channel.send(`${member}, you haven't sent any messages tracked by the bot yet.`);
            }

            const embed = new MessageEmbed()
                .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: 'Total Messages', value: `**${userRecord.messages}**`, inline: true },
                    { name: 'Today\'s Messages', value: `**${userRecord.dailyMessages}**`, inline: true },
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in `messages` command:', err);
            message.channel.send('An error occurred while fetching the message count. Please try again later.');
        }
    }
};
