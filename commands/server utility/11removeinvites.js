const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'removeinvite',
    description: 'Remove invites from a member',
    category: 'serveru',
    cooldown: 5,
    aliases: ['removeinv'],

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
            const Invite = client.secondDb.model('Invite', require('../../models/invite'));
            const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
            const inviteCount = parseInt(args[1], 10);

            if (!member || isNaN(inviteCount) || inviteCount <= 0) {
                return message.channel.send('Please mention a valid member and specify a positive number of invites to remove.');
            }

            let userInvite = await Invite.findOne({ guildId: message.guild.id, inviterId: member.id });

            if (!userInvite || userInvite.joins <= 0) {
                return message.channel.send('This member has no invites to remove.');
            }

            userInvite.joins = Math.max(userInvite.joins - inviteCount, 0);
            await userInvite.save();
            
            const userInvites = await Invite.find({ guildId: message.guild.id, inviterId: member.id });
            const Joins = userInvites.reduce((sum, invite) => sum + invite.joins, 0);

            const embed = new MessageEmbed()
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                // .setDescription(`Removed **${inviteCount}** invites from **${member.user.tag}'s** invite count.`)
                .addField('Total Joins', `**${Joins}**`, true)
                .addField('Removed Invites', `**${inviteCount}**`, true)
                .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error removing invites:', err);
            message.channel.send('An error occurred while removing invites.');
        }
    }
};
