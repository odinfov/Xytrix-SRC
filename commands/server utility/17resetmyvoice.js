const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'resetmyvoice',
    aliases: ['rmv'],
    description: 'Reset your own voice time',
    category: 'serveru',
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const User = client.secondDb.model('User', require('../../models/user'));

            const userRecord = await User.findOne({ 
                guild: message.guild.id, 
                user: message.author.id 
            });

            if (!userRecord) {
                return message.channel.send('You have no voice time recorded!');
            }

            userRecord.voiceTime = 0;
            userRecord.dailyVoiceTime = 0;
            await userRecord.save();

            const embed = new MessageEmbed()
                .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setDescription(`**Successfully reset your all voice time.**`)
                .setColor(client.color)

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in resetmyvoice command:', err);
            message.channel.send('An error occurred while resetting your voice time.');
        }
    }
};
