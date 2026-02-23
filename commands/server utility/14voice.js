const { MessageEmbed } = require('discord.js');

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let formattedTime = '';
    if (hours > 0) formattedTime += `${hours}h `;
    if (minutes > 0) formattedTime += `${minutes}m `;
    if (remainingSeconds > 0) formattedTime += `${remainingSeconds}s`;
    
    return formattedTime.trim() || '0s';
}

module.exports = {
    name: 'checkvoice',
    aliases: ['v'],
    description: 'Check how long a member has spent in voice channels',
    category: 'serveru',
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const User = client.secondDb.model('User', require('../../models/user'));
            const member = message.mentions.members.first() || message.member;

            const userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });

            if (!userRecord) {
                return message.channel.send(`${member}, you haven't spent any time in voice channels yet.`);
            }

            let currentSessionTime = 0;
            if (userRecord.isInVoice && userRecord.voiceJoinTimestamp) {
                const now = new Date();
                currentSessionTime = Math.floor((now - new Date(userRecord.voiceJoinTimestamp)) / 1000);
            }

            const totalVoiceTime = (userRecord.voiceTime || 0) + currentSessionTime;
            const dailyVoiceTime = (userRecord.dailyVoiceTime || 0) + currentSessionTime;

            const embed = new MessageEmbed()
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: 'Total Voice Time', value: formatDuration(totalVoiceTime), inline: true },
                    { name: 'Todays Voice Time', value: formatDuration(dailyVoiceTime), inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in `voice` command:', err);
            message.channel.send('An error occurred while fetching the voice time. Please try again later.');
        }
    }
};
