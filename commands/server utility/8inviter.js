const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'inviter',
    description: 'Find out who invited a member to the server.',
    category: 'serveru',
    cooldown: 5,

    run: async (client, message, args) => {
        try {
            const Invite = client.secondDb.model('Invite', require('../../models/invite'));
            const target = message.mentions.members.first() || message.member;
            const inviteRecord = await Invite.findOne({
                guildId: message.guild.id,
                members: target.id,
            });

            if (!inviteRecord) {
                return message.channel.send(`${target.user.tag} was not invited using a tracked invite.`);
            }
            const inviter = await client.users.fetch(inviteRecord.inviterId).catch(() => null);
            const embed = new MessageEmbed()
                .setAuthor(`${target.user.username} Was Invited By`, target.user.displayAvatarURL({ dynamic: true }))
                .setDescription(inviter ? `<@${inviter.id}> | ${inviter.tag}` : 'Unknown (User may have left or been deleted)')
                .setColor(client.color)
                .setTimestamp()
                .setFooter({ text: `Invite Code: ${inviteRecord.inviteCode}` });

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('Error in `inviter` command:', err);
            message.channel.send('An error occurred while fetching invite details. Please try again later.');
        }
    },
};
