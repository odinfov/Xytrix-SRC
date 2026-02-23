const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'warn',
    aliases: [],
    description: 'Warn a user',
    category: 'mod',

    run: async (client, message, args) => {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} You don't have permission to use this command.`);
            return message.channel.send({ embeds: [embed] });
        }

        const userId = args[0];
        const reason = args.slice(1).join(' ') || 'None';
        
        let user;
        try {
            user = await getUserFromMention(message, userId) || await client.users.fetch(userId);
        } catch (error) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} Couldn't find that user.`);
            return message.channel.send({ embeds: [embed] });
        }

        if (!user) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} You need to mention a user to warn.`);
            return message.channel.send({ embeds: [embed] });
        }

        if (user.id === message.author.id) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} You cannot warn yourself.`);
            return message.channel.send({ embeds: [embed] });
        }

        if (user.id === client.user.id) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} You cannot warn me.`);
            return message.channel.send({ embeds: [embed] });
        }
        if (user.bot) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} You cannot warn a bot.`);
            return message.channel.send({ embeds: [embed] });
        }
        
        const member = message.guild.members.cache.get(user.id);
        if (user.id === message.guild.ownerId) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} You cannot warn the server owner.`);
            return message.channel.send({ embeds: [embed] });
        }

        if (member && member.permissions.has('ADMINISTRATOR')) {
            const embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`${client.emoji.cross} You cannot warn an admin.`);
            return message.channel.send({ embeds: [embed] });
        }

        const embed = new MessageEmbed()
            .setAuthor('Successfully Warned', user.displayAvatarURL({ dynamic: true }))
            .setDescription(`
            <:Xytrix_user:1434977546125967453> Target User: <@${user.id}>
            <:Xytrix_email:1434978081654964474> DM Sent: Yes
            <:Xytrix_warning:1434978229730414704> **Warned By**: [${message.member.displayName}](https://discord.com/users/${message.author.id})
            <:Xytrix_Gems:1434978435599433738> Reason: ${reason || 'None'}
            `)
            .setColor(client.color)
            .setFooter(`Moderator`, message.author.displayAvatarURL({ dynamic: true }));

            try {
                const warningEmbed = new MessageEmbed()
                .setAuthor('Warn Notification', client.user.displayAvatarURL())
                .setColor(client.color)
                .setDescription(`<:Xytrix_user:1434977546125967453> You have been warned in **${message.guild.name}** Warned By: [${message.member.displayName}](https://discord.com/users/${message.author.id})\n<:Xytrix_Gems:1434978435599433738> **Reason:** ${reason}`)

            await user.send({ embeds: [warningEmbed] });

            } catch (error) {
                embed.setDescription(embed.description.replace('**DM Sent**: Yes', '**DM Sent**: No'));
            }

        return message.channel.send({ embeds: [embed] });
    }
};

async function getUserFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return null;

    const id = matches[1];
    try {
        return await message.client.users.fetch(id);
    } catch {
        return null;
    }
}
