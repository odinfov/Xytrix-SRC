const { Message, Client, MessageEmbed, Permissions } = require('discord.js')
const Discord = require('discord.js')
const ms = require('ms')
const moment = require('moment')
require('moment-duration-format')
let roleAssignmentInterval
let startTime
const config = require('../../config.json')
const Admin = require('../../models/admin');

module.exports = {
    name: 'role',
    aliases: ['r'],
    category: 'mod',
    description: `Assigns or removes a role from a user.`,
    premium: false,

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
        const embed = new MessageEmbed().setColor(client.color)
        let own = message.author.id == message.guild.ownerId


        
        let isSpecialMember = config.boss.includes(message.author.id);

        if (!isSpecialMember && !admin && !message.member.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Manage Roles\` permissions to use this command.`
                        )
                ]
            })
        }

        if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I don't have \`Manage Roles\` permissions to execute this command.`
                        )
                ]
            })
        }


        const hasHigherRole = client.util.hasHigher(message.member);

        if (
            !own && !admin &&
            !isSpecialMember &&
            message.member.roles.highest.position <=
                message.guild.me.roles.highest.position
        ) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have a higher role than me to use this command.`
                        )
                ]
            })
        }
        let role = await findMatchingRoles(
            message.guild,
            args.slice(1).join(' ')
        )

        let member =
            message.guild.members.cache.get(args[0]) ||
            message.mentions.members.first()
        if (!member) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} That's not quite right.\nTry using: \`${message.guild.prefix}role <user> <role>\``
                        )
                ]
            })
        }

        role = role[0]
        if (!role) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You didn't provide a valid role.\n\`${message.guild.prefix}role <user> <role>\``
                        )
                ]
            })
        }

        const dangerousPermissions = [
            Permissions.FLAGS.ADMINISTRATOR,
            Permissions.FLAGS.KICK_MEMBERS,
            Permissions.FLAGS.BAN_MEMBERS,
            Permissions.FLAGS.MANAGE_CHANNELS,
            Permissions.FLAGS.MANAGE_GUILD,
            Permissions.FLAGS.MENTION_EVERYONE,
            Permissions.FLAGS.MANAGE_ROLES,
            Permissions.FLAGS.MANAGE_WEBHOOKS
        ];

        if (
            admin &&
            dangerousPermissions.some(permission => role.permissions.has(permission))
        ) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You are not supposed to give or remove roles with dangerous permissions.`
                        )
                ]
            });
        }
        if (role.managed) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} This Role Is Managed By Integration`
                        )
                ]
            })
        }
        if (role.position >= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I can't assign this role because my highest role is either lower than or equal to the specified role.`
                        )
                ]
            })
        }
        if (!own && !isSpecialMember && message.member.roles.highest.position <= role.position) {
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I can't provide this role as your highest role is either below or equal to the provided role.`
                        )
                ]
            })
        }
        let hasRole = member.roles.cache.has(role.id)
        if (hasRole) {
            member.roles.remove(
                role.id,
                `${message.author.tag}(${message.author.id})`
            )
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully removed <@&${role.id}> from <@${member.id}>.`
                        )
                ]
            })
        } else {
            member.roles.add(
                role.id,
                `${message.author.tag}(${message.author.id})`
            )
            return message.channel.send({
                embeds: [
                    embed
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully added <@&${role.id}> to <@${member.id}>.`
                        )
                ]
            })
        }
    }
}

function findMatchingRoles(guild, query) {
    const ROLE_MENTION = /<?@?&?(\d{17,20})>?/
    if (!guild || !query || typeof query !== 'string') return []

    const patternMatch = query.match(ROLE_MENTION)
    if (patternMatch) {
        const id = patternMatch[1]
        const role = guild.roles.cache.find((r) => r.id === id)
        if (role) return [role]
    }

    const exact = []
    const startsWith = []
    const includes = []
    guild.roles.cache.forEach((role) => {
        const lowerName = role.name.toLowerCase()
        if (role.name === query) exact.push(role)
        if (lowerName.startsWith(query.toLowerCase())) startsWith.push(role)
        if (lowerName.includes(query.toLowerCase())) includes.push(role)
    })
    if (exact.length > 0) return exact
    if (startsWith.length > 0) return startsWith
    if (includes.length > 0) return includes
    return []
}
