const { MessageEmbed } = require('discord.js')
const { getSettingsar } = require('../../models/autorole')
const config = require('../../config.json')
module.exports = {
    name: 'welcomereset',
    category: 'welcomer',
    aliases: [],
    description: `Resets or clears the welcome message settings.`,
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
        let response
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
        let status = settings.welcome.enabled
        if (status !== true) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `The welcomer module for this server is already disabled.`
                        )
                ]
            })
        }
        await reset(client, settings)
        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(
                        `${client.emoji.tick} Successfully reset the welcomer module.`
                    )
            ]
        })
    }
}

async function reset(client, settings) {
    ;(settings.welcome.enabled = false),
        (settings.welcome.channel = null),
        (settings.welcome.content = null),
        (settings.welcome.autodel = 0),
        (settings.welcome.embed = {
            image: null,
            description: null,
            color: null,
            title: null,
            thumbnail: false,
            footer: null,
        })
    settings.save()
}
