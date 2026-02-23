const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'removevoice',
    aliases: ['removev'],
    description: 'Remove voice time from a user',
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
                return message.channel.send('Please use the format: &removevoice @user <minutes>');
            }

            if (minutes <= 0) {
                return message.channel.send('Please provide a positive number of minutes!');
            }

            const User = client.secondDb.model('User', require('../../models/user'));
            let userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });

            if (!userRecord) {
                return message.channel.send('This user has no voice time recorded!');
            }

           
            const seconds = minutes * 60;
            
            
            if (seconds > userRecord.voiceTime) {
                return message.channel.send('Cannot remove more time than the user has!');
            }
            userRecord.voiceTime = Math.max(0, userRecord.voiceTime - seconds);
            userRecord.dailyVoiceTime = Math.max(0, userRecord.dailyVoiceTime - seconds);

            await userRecord.save();

            const embed = new MessageEmbed()
                .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                // .setDescription(`Removed **${minutes}** minutes from ${member.user.tag}'s voice time.`)
                .addFields(
                    { name: 'Total Voice Time', value: `**${Math.floor(userRecord.voiceTime / 60)} minutes**`, inline: true },
                    { name: 'Removed Voice Time', value: `**${minutes} minutes**`, inline: true },
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setColor(client.color)
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in removevoice command:', err);
            message.channel.send('An error occurred while removing voice time.');
        }
    }
};
