const { MessageEmbed } = require('discord.js')
const { getSettingsar } = require('../../models/autorole')
const config = require('../../config.json')
module.exports = {
    name: 'welcomechannel',
    category: 'welcomer',
    aliases: [],
    description: `Sets the channel where greet messages will be sent.`,
    premium: false,
    run: async (client, message, args) => {

        if (message.guild.memberCount < 0) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Your server must have at least 30 members to use this feature.`
                        )
                ]
            })
        }
        let isSpecialMember = config.boss.includes(message.author.id);
        const settings = await getSettingsar(message.guild)     
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `You must have \`Administration\` perms to run this command.`
                        )
                ]
            })
        }
        let isown = message.author.id == message.guild.ownerId
        if (!isSpecialMember && !isown && !client.util.hasHigher(message.member)) {
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
        let channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0])
        if (!channel) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `You didn't mentioned the channel to set as welcome channel.`
                        )
                ]
            })
        }
        let response = await client.util.setChannel(settings, channel)
        return message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(response)
            ]
        })
    }
}
