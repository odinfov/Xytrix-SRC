const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'resetmymessages',
    aliases: ['resetmymsg', 'rmm'],
    description: 'Reset your own message count in this server',
    category: 'serveru',
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const User = client.secondDb.model('User', require('../../models/user'));

            
            const user = message.author;

            
            const userRecord = await User.findOne({ guild: message.guild.id, user: user.id });

            if (!userRecord) {
                return message.channel.send(`${user}, you don't have a message record tracked by the bot yet.`);
            }

            
            userRecord.messages = 0;
            userRecord.dailyMessages = 0;
            await userRecord.save();

            const embed = new MessageEmbed()
                .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`**Successfully reset your all message count.**`)
                // .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in `resetmymessages` command:', err);
            message.channel.send('An error occurred while resetting your message count. Please try again later.');
        }
    }
};
