const { MessageEmbed } = require('discord.js');

module.exports = {
    name: "inviteinfo",
    aliases: ["invinfo"],
    description: "Displays the active invite code(s) of a user in this guild.",
    category: "serveru",
    cooldown: 5,
    premium: false,

    run: async (client, message, args) => {
        try {
            const member = message.mentions.members.first() || message.member;
            
            const invites = await message.guild.invites.fetch();
            
            const userInvites = invites.filter(inv => inv.inviter && inv.inviter.id === member.user.id);

            if (userInvites.size === 0) {
                return message.channel.send(`User has not created any invite links.`);
            }

            const inviteData = userInvites.map(invite => `Invite \`${invite.code}\` : \`${invite.uses}\` Uses`).join('\n');
            const embed = new MessageEmbed()
                .setAuthor(`Invite codes of ${member.user.username}`, member.user.displayAvatarURL({ dynamic: true }))
                .setDescription(inviteData)
                .setColor(client.color)

            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            message.channel.send("An error occurred while fetching the invites. Please try again later.");
        }
    }
};
