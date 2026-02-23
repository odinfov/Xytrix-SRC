const { MessageEmbed } = require('discord.js')
const { getSettingsar } = require('../../models/autorole')
const config = require('../../config.json')

module.exports = {
    name: 'autorole',
    aliases: [],
    category: 'welcomer',
    subcommand: [
        'humans', 'humans add', 'humans remove', 'humans reset', 'bots', 'bots add', 'bots remove', 'bots reset', 'all', 'all add', 'all remove', 'all reset', 'bots', 'list', 'reset'
    ],
    description: `Automatically assigns roles to members upon joining the server.`,
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
        const err = new MessageEmbed()
            .setColor(client.color)
            .setTitle('Autorole Commands')
            .setDescription(`Make your server more welcoming by automatically assigning roles to new members.`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields([
                { name: `Autorole humans`, value: `To show humans auto role commands, use: \`${prefix}autorole humans\`` },
                { name: `Autorole bots`, value: `To show bots auto role commands, use: \`${prefix}autorole bots\`` },
                { name: `Autorole all`, value: `To show all auto role commands, use: \`${prefix}autorole all\`` },
                { name: `Autorole list`, value: `To show all auto roles, use: \`${prefix}autorole list\`` },
                { name: `Autorole reset`, value: `To reset all auto roles, use: \`${prefix}autorole reset\`` },
            ])
            .setFooter({
                text: `Note: Roles with Administration Perms will be ignored.`,
                iconURL: client.user.displayAvatarURL()
            })

        const option = args[0]?.toLowerCase();
        const subOption = args[1]?.toLowerCase();
        const roleInput = args.slice(2).join(' ');

        let response;
        const settings = await getSettingsar(message.guild);

        if (option === 'humans' && !subOption) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Humans Auto Roles')
                        .setDescription(`Manage auto roles for human members in your server.`)
                        .setThumbnail(client.user.displayAvatarURL())
                        .addFields([
                            { name: `\`Add autorole to humans\``, value: `To add autorole to humans use: \`${prefix}autorole humans add\``},
                            { name: `\`Remove autorole from humans\``, value: `To remove autorole from humans use: \`${prefix}autorole humans remove\``},
                            { name: `\`Reset autorole for humans\``, value: `To reset autorole from humans use: \`${prefix}autorole reset\``},
                    ])
                ]
            });
        }
        
        if (option === 'bots' && !subOption) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Bots Auto Roles')
                        .setDescription(`Manage auto roles for bots in your server.`)
                        .setThumbnail(client.user.displayAvatarURL())
                        .addFields([
                            { name: `\`Add autorole to bots\``, value: `To add autorole to bots use: \`${prefix}autorole bots add\``},
                            { name: `\`Remove autorole from bots\``, value: `To remove autorole from bots use: \`${prefix}autorole bots remove\``},
                            { name: `\`Reset autorole for bots\``, value: `To reset autorole from bots use: \`${prefix}autorole reset\``},
                    ])
                ]
            });
        }
        
        if (option === 'all' && !subOption) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('All Auto Roles')
                        .setDescription(`Manage auto roles for both humans and bots in your server.`)
                        .setThumbnail(client.user.displayAvatarURL())
                        .addFields([
                            { name: `\`Add autorole to all\``, value: `To add autorole to all use: \`${prefix}autorole all add\``},
                            { name: `\`Remove autorole from all\``, value: `To remove autorole from all use: \`${prefix}autorole all remove\``},
                            { name: `\`Reset autorole for all\``, value: `To reset autorole from all use: \`${prefix}autorole reset\``},
                        ])
                ]
            });
        }

        try {
            if (option === 'humans') {
                if (subOption === 'add') {
                    const roles = findMatchingRoles(message.guild, roleInput);
                    if (roles.length === 0) 
                        response = 'No matching roles found';
                    else 
                        response = await addhumanautorole({ guild: message.guild, client }, roles[0]);
                } else if (subOption === 'remove') {
                    const roles = findMatchingRoles(message.guild, roleInput);
                    if (roles.length === 0) 
                        response = 'No matching roles found';
                    else 
                        response = await removehumanautorole({ guild: message.guild, client }, roles[0]);
                } else if (subOption === 'reset') {
                    response = await resethumanautorole({ guild: message.guild, client });
                }
            } else if (option === 'bots') {
                if (subOption === 'add') {
                    const roles = findMatchingRoles(message.guild, roleInput);
                    if (roles.length === 0) 
                        response = 'No matching roles found';
                    else 
                        response = await addbotautorole({ guild: message.guild, client }, roles[0]);
                } else if (subOption === 'remove') {
                    const roles = findMatchingRoles(message.guild, roleInput);
                    if (roles.length === 0) 
                        response = 'No matching roles found';
                    else 
                        response = await removebotautorole({ guild: message.guild, client }, roles[0]);
                } else if (subOption === 'reset') {
                    response = await resetbotautorole({ guild: message.guild, client });
                }
            } else if (option === 'all') {
                if (subOption === 'add') {
                    const roles = findMatchingRoles(message.guild, roleInput);
                    if (roles.length === 0) 
                        response = 'No matching roles found';
                    else {
                        response = await addAutoRole({ guild: message.guild, client }, roles[0]);
                    }
                } else if (subOption === 'remove') {
                    const roles = findMatchingRoles(message.guild, roleInput);
                    if (roles.length === 0) 
                        response = 'No matching roles found';
                    else {
                        response = await removeAutoRole({ guild: message.guild, client }, roles[0]);
                    }
                } else if (subOption === 'reset') {
                    response = await resetAllAutoRole({ guild: message.guild, client });
                }
            } else if (option === 'list') {
                response = await listAutoRole({ guild: message.guild, client });
            } else if (option === 'reset') {
                response = await resetAutoRole({ guild: message.guild, client });                
            } else {
                return message.channel.send({ embeds: [err] });
            }

            await message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(response)
                        .setColor(client.color)
                ]
            });
        } catch (error) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`${client.emoji.cross} Use Add / Remove / Reset.`)
                        .setColor(client.color)
                ]
            });
        }
    }
}  

async function addAutoRole({ guild, client }, role) {
    const settings = await getSettingsar(guild)
    if (role) {
        if (!guild.me.permissions.has('MANAGE_ROLES'))
            return `${client.emoji.cross} I don't have the \`MANAGE_ROLES\` permission`
        if (guild.me.roles.highest.position < role.position)
            return `${client.emoji.cross} I don't have the permissions to assign this role`
        if (role.managed)
            return `${client.emoji.cross} This role is managed by an integration.`
    }
    if (!role) {
        settings.autorole = []
        await settings.save()
        return `${client.emoji.tick} Autorole module was successfully disabled.`
    }
    if (settings.autorole.includes(role.id))
        return `${client.emoji.cross} This role is already present in the autorole config.`
    if (settings.autorole.length == 10)
        return `${client.emoji.cross} Maximum 10 roles can be set for Auto Roles.`
    else settings.autorole.push(role.id)
    await settings.save()
    return `${client.emoji.tick} Successfully **added** <@&${role.id}> to Autorole Config.`
}

async function removeAutoRole({ guild, client }, role) {
    const settings = await getSettingsar(guild)
    if (role) {
        if (!guild.me.permissions.has('MANAGE_ROLES'))
            return `${client.emoji.cross} I don't have the \`MANAGE_ROLES\` permission`
    }
    if (!settings.autorole.includes(role.id))
        return `${client.emoji.cross} This role is not present in the autorole config.`
    if (settings.autorole.length == 0)
        return `${client.emoji.cross} There are no Autoroles in my config.`
    else settings.autorole = settings.autorole.filter((r) => r !== role.id)
    await settings.save()
    return `${client.emoji.tick} Successfully **removed** <@&${role.id}> from Autorole Config.`
}

async function addhumanautorole({ guild, client }, role) {
    const settings = await getSettingsar(guild)
    
    if (!guild.me.permissions.has('MANAGE_ROLES'))
        return `${client.emoji.cross} I don't have the \`MANAGE_ROLES\` permission`
    
    if (guild.me.roles.highest.position < role.position)
        return `${client.emoji.cross} I don't have the permissions to assign this role`
    
    if (role.managed)
        return `${client.emoji.cross} This role is managed by an integration.`

    settings.humanautorole = settings.humanautorole || []

    if (settings.humanautorole.includes(role.id))
        return `${client.emoji.cross} This role is already in humans autorole config.`

    if (settings.humanautorole.length >= 10)
        return `${client.emoji.cross} Maximum 10 roles can be set for Humans Auto Roles.`

    settings.humanautorole.push(role.id)
    await settings.save()

    return `${client.emoji.tick} Successfully added <@&${role.id}> to Humans Autorole.`
}

async function removehumanautorole({ guild, client }, role) {
    const settings = await getSettingsar(guild)
    
    if (!guild.me.permissions.has('MANAGE_ROLES'))
        return `${client.emoji.cross} I don't have the \`MANAGE_ROLES\` permission`

    settings.humanautorole = settings.humanautorole || []

    if (!settings.humanautorole.includes(role.id))
        return `${client.emoji.cross} This role is not in humans autorole config.`

    settings.humanautorole = settings.humanautorole.filter(r => r !== role.id)
    await settings.save()

    return `${client.emoji.tick} Successfully removed <@&${role.id}> from Humans Autorole.`
}

async function listAutoRole({ guild, client }) {
    const settings = await getSettingsar(guild)

    settings.autorole = settings.autorole || []
    settings.humanautorole = settings.humanautorole || []
    settings.botautorole = settings.botautorole || []

    if (settings.autorole.length === 0 && 
        settings.humanautorole.length === 0 && 
        settings.botautorole.length === 0) {
        return 'There are no Autoroles available for this server.'
    }

    let roleResponses = []

    
    let roles1 = settings.autorole
        .map((role) => `${client.emoji.dot} <@&${role}> (${role})`)
        .join('\n') || 'No roles configured'
    roleResponses.push(`**Auto Role list for ${guild.name} - ${settings.autorole.length}**\n${roles1}`)

    let roles2 = settings.humanautorole
        .map((role) => `${client.emoji.dot} <@&${role}> (${role})`)
        .join('\n') || 'No roles configured'
    roleResponses.push(`**Human Auto Role list for ${guild.name} - ${settings.humanautorole.length}**\n${roles2}`)

    let roles3 = settings.botautorole
        .map((role) => `${client.emoji.dot} <@&${role}> (${role})`)
        .join('\n') || 'No roles configured'
    roleResponses.push(`**Bot Auto Role list for ${guild.name} - ${settings.botautorole.length}**\n${roles3}`)

    return roleResponses.join('\n\n')
}

async function addbotautorole({ guild, client }, role) {
    const settings = await getSettingsar(guild)
    
    if (!guild.me.permissions.has('MANAGE_ROLES'))
        return `${client.emoji.cross} I don't have the \`MANAGE_ROLES\` permission`
    
    if (guild.me.roles.highest.position < role.position)
        return `${client.emoji.cross} I don't have the permissions to assign this role`
    
    if (role.managed)
        return `${client.emoji.cross} This role is managed by an integration.`

    settings.botautorole = settings.botautorole || []

    if (settings.botautorole.includes(role.id))
        return `${client.emoji.cross} This role is already in bot autorole config.`

    if (settings.botautorole.length >= 10)
        return `${client.emoji.cross} Maximum 10 roles can be set for Bot Auto Roles.`

    settings.botautorole.push(role.id)
    await settings.save()

    return `${client.emoji.tick} Successfully added <@&${role.id}> to Bot Autorole.`
}

async function removebotautorole({ guild, client }, role) {
    const settings = await getSettingsar(guild)
    
    if (!guild.me.permissions.has('MANAGE_ROLES'))
        return `${client.emoji.cross} I don't have the \`MANAGE_ROLES\` permission`

    settings.botautorole = settings.botautorole || []

    if (!settings.botautorole.includes(role.id))
        return `${client.emoji.cross} This role is not in bot autorole config.`

    settings.botautorole = settings.botautorole.filter(r => r !== role.id)
    await settings.save()

    return `${client.emoji.tick} Successfully removed <@&${role.id}> from Bot Autorole.`
}

async function resetbotautorole({ guild, client }) {
    const settings = await getSettingsar(guild)
    
    settings.botautorole = []
    await settings.save()

    return `${client.emoji.tick} Bot Autorole configuration reset.`
}

async function resethumanautorole({ guild, client }) {
    const settings = await getSettingsar(guild)
    
    settings.humanautorole = []
    await settings.save()

    return `${client.emoji.tick} Humans Autorole configuration reset.`
}

async function resetAllAutoRole({ guild, client }) {
    const settings = await getSettingsar(guild)
    
    settings.autorole = []
    await settings.save()

    return `${client.emoji.tick} All Autorole configuration reset.`
}
async function resetAutoRole({ guild, client }) {
    const settings = await getSettingsar(guild);
    
    settings.humanautorole = [];
    settings.botautorole = [];
    settings.autorole = [];
    await settings.save();

    return `${client.emoji.tick} All Autorole configurations have been reset.`;
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
