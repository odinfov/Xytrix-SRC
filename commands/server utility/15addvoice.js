const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
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
    name: 'addvoice',
    aliases: ['addv'],
    description: 'Add voice time to a user',
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

            const member = message.mentions.members.first();
            const minutes = parseInt(args[1]);

            if (!member || isNaN(minutes)) {
                return message.channel.send('Please use the format: &addvoice @user <minutes>');
            }

            if (minutes <= 0) {
                return message.channel.send('Please provide a positive number of minutes!');
            }

            const User = client.secondDb.model('User', require('../../models/user'));
            let userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });

            if (!userRecord) {
                userRecord = new User({
                    user: member.user.id,
                    guild: message.guild.id,
                    voiceTime: 0,
                    dailyVoiceTime: 0,
                    lastVoiceDate: new Date()
                });
            }

            const seconds = minutes * 60;
            userRecord.voiceTime = (userRecord.voiceTime || 0) + seconds;
            userRecord.dailyVoiceTime = (userRecord.dailyVoiceTime || 0) + seconds;

            await userRecord.save();
            let currentSessionTime = 0;
            if (userRecord.isInVoice && userRecord.voiceJoinTimestamp) {
                const now = new Date();
                currentSessionTime = Math.floor((now - new Date(userRecord.voiceJoinTimestamp)) / 1000);
            }
            const totalVoiceTime = (userRecord.voiceTime || 0) + currentSessionTime;

            const embed = new MessageEmbed()
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .addFields(
                    { name: 'Total Voice Time', value: `**${Math.floor(userRecord.voiceTime / 60)} minutes**`, inline: true },
                    { name: 'Added Voice Time', value: `**${minutes} minutes**`, inline: true }
                )
                // .setDescription(`Added **${minutes}** minutes to **${member.user.tag}'s** voice time.`)
                .setColor(client.color)
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in addvoice command:', err);
            message.channel.send('An error occurred while adding voice time.');
        }
    }
};
