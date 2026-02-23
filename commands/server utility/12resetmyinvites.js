const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'resetmyinvite',
    aliases: ['rmi'],
    description: 'Reset your invite stats',
    category: 'serveru',
    cooldown: 5,

    run: async (client, message) => {
        try {
            const Invite = client.secondDb.model('Invite', require('../../models/invite'));
            const userInvites = await Invite.find({ guildId: message.guild.id, inviterId: message.author.id });

            if (!userInvites.length) {
                return message.channel.send('You have no invite stats to reset.');
            }

            for (const invite of userInvites) {
                invite.joins = 0;
                invite.leaves = 0;
                invite.rejoins = 0;
                await invite.save();
            }

            const embed = new MessageEmbed()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                .setDescription('**Successfully reset your all invite stats.**')
                .setColor(client.color);

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('Error resetting invite stats:', err);
            message.channel.send('An error occurred while resetting your invite stats.');
        }
    }
};
