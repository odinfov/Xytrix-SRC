const { MessageEmbed } = require('discord.js');

const PERMISSIONS = {
    "ADMINISTRATOR": "Administrator",
    "ADD_REACTIONS": "Add Reactions",
    "ATTACH_FILES": "Attach Files",
    "BAN_MEMBERS": "Ban Members",
    "CHANGE_NICKNAME": "Change Nickname",
    "CONNECT": "Connect",
    "CREATE_INSTANT_INVITE": "Create Instant Invite",
    "CREATE_PRIVATE_THREADS": "Create Private Threads",
    "CREATE_PUBLIC_THREADS": "Create Public Threads",
    "DEAFEN_MEMBERS": "Deafen Members",
    "EMBED_LINKS": "Embed Links",
    "KICK_MEMBERS": "Kick Members",
    "MANAGE_CHANNELS": "Manage Channels",
    "MANAGE_EMOJIS_AND_STICKERS": "Manage Emojis And Stickers",
    "MANAGE_EVENTS": "Manage Events",
    "MANAGE_GUILD": "Manage Server",
    "MANAGE_MESSAGES": "Manage Messages",
    "MANAGE_NICKNAMES": "Manage Nicknames",
    "MANAGE_ROLES": "Manage Roles",
    "MANAGE_THREADS": "Manage Threads",
    "MANAGE_WEBHOOKS": "Manage Webhooks",
    "MENTION_EVERYONE": "Mention Everyone",
    "MODERATE_MEMBERS": "Moderate Members",
    "MOVE_MEMBERS": "Move Members",
    "MUTE_MEMBERS": "Mute Members",
    "PRIORITY_SPEAKER": "Priority Speaker",
    "READ_MESSAGE_HISTORY": "Read Message History",
    "REQUEST_TO_SPEAK": "Request To Speak",
    "SEND_MESSAGES": "Send Messages",
    "SEND_MESSAGES_IN_THREADS": "Send Messages In Threads",
    "SEND_TTS_MESSAGES": "Send TTS Messages",
    "SEND_VOICE_MESSAGES": "Send Voice Messages",
    "SPEAK": "Speak",
    "START_EMBEDDED_ACTIVITIES": "Start Embedded Activities",
    "STREAM": "Stream",
    "USE_APPLICATION_COMMANDS": "Use Application Commands",
    "USE_EXTERNAL_EMOJIS": "Use External Emojis",
    "USE_EXTERNAL_STICKERS": "Use External Stickers",
    "USE_PRIVATE_THREADS": "Use Private Threads",
    "USE_PUBLIC_THREADS": "Use Public Threads",
    "USE_SOUNDBOARD": "Use Soundboard",
    "USE_VOICE_ACTIVITY": "Use Voice Activity",
    "VIEW_AUDIT_LOG": "View Audit Log",
    "VIEW_CHANNEL": "View Channel"
};

module.exports = {
    name: 'roleinfo',
    aliases: ['ri'],
    category: 'info',
    description: 'To Get Information About A Role',
    premium: false,
    run: async (client, message, args) => {
        let role =
            message.mentions.roles.first() ||
            message.guild.roles.cache.get(args[0]);
        if (!role) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You didn't provide a valid role.`
                        )
                ]
            });
        }

        
        let positionFromTop = message.guild.roles.cache.size - role.position;

        let color = role.color === 0 ? '#000000' : role.color;
        let created = `<t:${Math.round(role.createdTimestamp / 1000)}:R>`;
        let roleMembers = role.members.size;

        const embed = new MessageEmbed()
            .setAuthor({
                name: `Role Name: ${role.name}`,
                iconURL: client.user.displayAvatarURL()
            })
            .addFields([
                {
                    name: 'Role Id',
                    value: `${role.id}`,
                    inline: true
                },
                {
                    name: 'Role Position',
                    value: `${positionFromTop}`,
                    inline: true
                },
                {
                    name: 'Role Color',
                    value: `${color}`,
                    inline: true
                },
                {
                    name: 'Role Created At',
                    value: `${created}`,
                    inline: true
                },
                {
                    name: 'Role Mentionable',
                    value: `${role.mentionable}`,
                    inline: true
                },
                {
                    name: 'Integration Role',
                    value: `${role.managed}`,
                    inline: true
                },
                {
                    name: 'Allowed Permissions',
                    value: role.permissions.toArray().length > 0
                        ? role.permissions
                              .toArray()
                              .sort((a, b) => a.localeCompare(b))
                              .map((p) => `\`${PERMISSIONS[p] || p}\``)
                              .join(', ')
                        : 'No permissions',
                    inline: true
                },
                {
                    name: 'Role Members',
                    value: `${roleMembers}`,
                    inline: true
                }
            ])
            .setColor(client.color);

        message.channel.send({ embeds: [embed] });
    }
};
