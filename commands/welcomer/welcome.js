const { MessageEmbed } = require('discord.js')
const { getSettingsar } = require('../../models/autorole')
const config = require('../../config.json')
module.exports = {
    name: 'welcome',
    aliases: ['setwelcome'],
    category: 'welcomer',
    description: `Set greets users when they join the server.`,
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
        let prefix = message.guild.prefix;
        let status = args[0]?.toUpperCase()
        if (!status) {
            let embed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`Set greets users when user join the server.`)
                .addFields([
                    {
                        name: `Welcome Module`,
                        value: `To enable / disable welcome, use: \`${prefix}welcome <on | off>\``
                    },
                    {
                        name: `Welcome Channel`,
                        value: `To set the welcome channel, use: \`${prefix}welcomechannel\``
                    },
                    {
                        name: `Welcome Message`,
                        value: `To set the welcome message, use:\`${prefix}welcomemessage\``
                    },
                    {
                        name: `Welcome Setup`,
                        value: `To automate the welcome setup, use: \`${prefix}welcomesetup\``
                    },
                    {
                        name: `Test Welcome Message`,
                        value: `To test the welcome message, use: \`${prefix}welcometest\``
                    },
                    {
                        name: `Reset Welcome Module`,
                        value: `To reset the welcome module, use: \`${prefix}welcomereset\``
                    }
                ])
                .setTitle(`Welcome Commands`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            return message.channel.send({ embeds: [embed] })
        }
        if (!['ON', 'OFF'].includes(status)) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `You didn't provide a valid status of welcome.\nStatus: \`on\`, \`off\``
                        )
                ]
            })
        }
        let response = await client.util.setStatus(settings, status)
        return message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(response)
            ]
        })
    }
}
