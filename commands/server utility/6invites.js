const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'invites',
    aliases: ['i'],
    description: 'Check your invite stats',
    category: 'serveru',
    cooldown: 5,

    run: async (client, message) => {
        try {
            const Invite = client.secondDb.model('Invite', require('../../models/invite'));
            const userInvites = await Invite.find({ guildId: message.guild.id, inviterId: message.author.id });

            if (!userInvites.length) {
                return message.channel.send('You have no invites tracked in this server.');
            }

            const Joins = userInvites.reduce((sum, invite) => sum + invite.joins, 0);
            const Leaves = userInvites.reduce((sum, invite) => sum + invite.leaves, 0);
            const Rejoins = userInvites.reduce((sum, invite) => sum + invite.rejoins, 0);
            const TotalInvites = Joins - Leaves;

            const embed = new MessageEmbed()
                .setAuthor(`${message.author.username}'s Invite Stats`, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription(`User currently has **${TotalInvites}** Invite${TotalInvites !== 1 ? 's' : ''}.`)
                .addField('Joins', `${Joins}`, true)
                .addField('Left', `${Leaves}`, true)
                .addField('Rejoins', `${Rejoins}`, true)
                .setFooter(`Requested by ${message.author.username}`, message.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error('Error fetching invite stats:', err);
            message.channel.send('An error occurred while fetching your invite stats.');
        }
    }
};
