const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'resetvoice',
    aliases: ['resetv'],
    description: 'Reset voice time for a user or all users',
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

            if (args[0]?.toLowerCase() === 'all') {
                await User.updateMany(
                    { guild: message.guild.id },
                    { $set: { voiceTime: 0, dailyVoiceTime: 0 } }
                );

                const embedAll = new MessageEmbed()
                    .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
                    .setDescription('**Successfully reset voice time for all users in the server.**')
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                    .setColor(client.color)

                return message.channel.send({ embeds: [embedAll] });
            }

            const member = message.mentions.members.first();
            if (!member) {
                return message.channel.send('Please mention a user or use "all" to reset everyone\'s voice time\nFormat: &resetvoice @user OR &resetvoice all');
            }

            const userRecord = await User.findOne({ guild: message.guild.id, user: member.user.id });
            if (!userRecord) {
                return message.channel.send('This user has no voice time recorded!');
            }

            userRecord.voiceTime = 0;
            userRecord.dailyVoiceTime = 0;
            await userRecord.save();

            const embed = new MessageEmbed()
                .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`Successfully reset all voice time for **${member.user.tag}**.`)
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setColor(client.color)

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error in resetvoice command:', err);
            message.channel.send('An error occurred while resetting voice time.');
        }
    }
};
