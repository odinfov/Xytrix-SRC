const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu
} = require('discord.js')
const config = require('../../config.json')
module.exports = {
    name: 'unlock',
    category: 'mod',
    aliases: [],
    description: `Ulocks provided channel`,
    premium: false,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_CHANNELS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `You must have \`Manage Channels\` permission to use this command.`
                )
            return message.channel.send({ embeds: [error] })
        }
        const channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]) ||
            message.channel
        if (channel.manageable) {
            channel.permissionOverwrites.edit(message.guild.id, {
                SEND_MESSAGES: true,
                reason: `${message.author.tag} (${message.author.id})`
            })
            const emb = new MessageEmbed()
                .setDescription(
                    `${client.emoji.tick} ${channel} has been successfully unlocked for @everyone role`
                )
                .setColor(client.color)
            return message.channel.send({ embeds: [emb] })
        } else {
            const embi = new MessageEmbed()
                .setDescription(
                    `I don't have adequate permissions to unlock this channel.`
                )
                .setColor(client.color)
            return message.channel.send({ embeds: [embi] })
        }
    }
}
