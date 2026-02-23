const { Message, Client, MessageEmbed } = require('discord.js')
const config = require('../../config.json')
const Admin = require('../../models/admin');
module.exports = {
    name: 'unbanall',
    aliases: [],
    category: 'mod',
    description: `Unbans all users who are currently banned from the server.`,
    premium: true,

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let admin = await Admin.findOne({ guildId, adminId });       
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !admin && !message.member.permissions.has('BAN_MEMBERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Ban Members\` permissions to use this command.`
                        )
                ]
            })
        }
        if (!message.guild.me.permissions.has('BAN_MEMBERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I must have \`Ban Members\` permissions to execute this command.`
                        )
                ]
            })
        }
        let isown = message.author.id == message.guild.ownerId
        if (!isSpecialMember && !isown && !admin && !client.util.hasHigher(message.member)) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have a higher role than me to use this command.`
                        )
                ]
            })
        }
        message.guild.bans.fetch().then((bans) => {
            if (bans.size == 0) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} There is no one banned in this server.`
                            )
                    ]
                })
            } else {
                let i = 0
                bans.forEach((ban) => {
                    message.guild.members.unban(ban.user.id)
                    i++
                })
                message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.tick} Successfully *Unbanned* \`${i}\` users from the server.`
                            )
                    ]
                })
            }
        })
    }
}
