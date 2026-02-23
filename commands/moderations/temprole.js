const { Message, Client, MessageEmbed, Permissions } = require('discord.js');
const Discord = require('discord.js');
const ms = require('ms');
const moment = require('moment');
require('moment-duration-format');
const config = require('../../config.json');
const Admin = require('../../models/admin');

module.exports = {
    name: 'temprole',
    aliases: ['tr'],
    category: 'mod',
    description: `Assigns or removes a temporary role from a user.`,
    subcommand: ['remove'],
    premium: false,

    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let admin = await Admin.findOne({ guildId, adminId });       
        const embed = new MessageEmbed().setColor(client.color);
        let own = message.author.id == message.guild.ownerId;
        let isSpecialMember = config.boss.includes(message.author.id);

        if (!isSpecialMember && !admin && !message.member.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} You must have \`Manage Roles\` permissions to use this command.`
                    )
                ]
            });
        }

        if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} I don't have \`Manage Roles\` permissions to execute this command.`
                    )
                ]
            });
        }

        // if (args[0]?.toLowerCase() === 'list') {
        //     const tempRoles = await client.db.get(`tempRoles_${guildId}`) || [];
            
        //     if (tempRoles.length === 0) {
        //         return message.channel.send({
        //             embeds: [
        //                 embed.setDescription(
        //                     `${client.emoji.cross} No temporary roles are currently active in this server.`
        //                 )
        //             ]
        //         });
        //     }
        //     const memberRoles = {};
        //     for (const roleData of tempRoles) {
        //         if (!memberRoles[roleData.memberId]) {
        //             memberRoles[roleData.memberId] = [];
        //         }
        //         memberRoles[roleData.memberId].push(roleData);
        //     }

        //     const listEmbed = new MessageEmbed()
        //         .setColor(client.color)
        //         .setTitle('Active Temporary Roles')
        //         .setDescription('Here are all active temporary roles in the server:')
        //         .setTimestamp();

        //     for (const [memberId, roles] of Object.entries(memberRoles)) {
        //         const member = await message.guild.members.fetch(memberId).catch(() => null);
        //         if (!member) continue;

        //         let memberField = '';
        //         for (const roleData of roles) {
        //             const role = message.guild.roles.cache.get(roleData.roleId);
        //             if (!role) continue;

        //             const timeLeft = roleData.expiresAt - Date.now();
        //             let expiresIn;
                    
        //             if (timeLeft < 60000) {
        //                 expiresIn = `${Math.ceil(timeLeft / 1000)} seconds`;
        //             } else {
        //                 const duration = moment.duration(timeLeft);
        //                 const days = duration.days();
        //                 const hours = duration.hours();
        //                 const minutes = duration.minutes();
                        
        //                 let timeString = '';
        //                 if (days > 0) timeString += `${days}d `;
        //                 if (hours > 0) timeString += `${hours}h `;
        //                 if (minutes > 0) timeString += `${minutes}m`;
        //                 expiresIn = timeString.trim();
        //             }

        //             const addedBy = await message.guild.members.fetch(roleData.addedById).catch(() => null);
        //             // memberField += `• Role: <@&${role.id}> Expires in: ${expiresIn} Added by: ${addedBy ? addedBy.user.tag : 'Unknown'}\n\n`;
        //             memberField += `• Role: <@&${role.id}> Added by: ${addedBy ? addedBy.user.tag : 'Unknown'}\n\n`;
        //         }

        //         if (memberField) {
        //             listEmbed.addField(`${member.user.tag}`, memberField);
        //         }
        //     }
        //     if (listEmbed.length > 6000) {
        //         const fields = listEmbed.fields;
        //         let currentEmbed = new MessageEmbed()
        //             .setColor(client.color)
        //             .setTitle('Active Temporary Roles (1)')
        //             .setDescription('Here are all active temporary roles in the server:')
        //             .setTimestamp();
                
        //         let embedCount = 1;
        //         let messagePromises = [];

        //         for (const field of fields) {
        //             if (currentEmbed.length + field.value.length > 5900) {
        //                 messagePromises.push(message.channel.send({ embeds: [currentEmbed] }));
        //                 embedCount++;
        //                 currentEmbed = new MessageEmbed()
        //                     .setColor(client.color)
        //                     .setTitle(`Active Temporary Roles (${embedCount})`)
        //                     .setDescription('Continued:')
        //                     .setTimestamp();
        //             }
        //             currentEmbed.addField(field.name, field.value);
        //         }
                
        //         messagePromises.push(message.channel.send({ embeds: [currentEmbed] }));
        //         await Promise.all(messagePromises);
        //     } else {
        //         await message.channel.send({ embeds: [listEmbed] });
        //     }
            
        //     return;
        // }

        if (args[0]?.toLowerCase() === 'remove') {
            if (!args[1]) {
                return message.channel.send({
                    embeds: [
                        embed.setDescription(
                            `${client.emoji.cross} Please mention a user to remove their temporary role.`
                        )
                    ]
                });
            }

            const member = message.guild.members.cache.get(args[1]) || message.mentions.members.first();
            if (!member) {
                return message.channel.send({
                    embeds: [
                        embed.setDescription(
                            `${client.emoji.cross} Please mention a valid user.`
                        )
                    ]
                });
            }

            const tempRoles = await client.db.get(`tempRoles_${guildId}`) || [];
            const memberTempRoles = tempRoles.filter(r => r.memberId === member.id);

            if (memberTempRoles.length === 0) {
                return message.channel.send({
                    embeds: [
                        embed.setDescription(
                            `${client.emoji.cross} This user has no temporary roles to remove.`
                        )
                    ]
                });
            }

            let removedRoles = 0;
            for (const data of memberTempRoles) {
                const role = message.guild.roles.cache.get(data.roleId);
                if (role && member.roles.cache.has(role.id)) {
                    try {
                        await member.roles.remove(role.id, `Temporary role removed by ${message.author.tag}`);
                        removedRoles++;
                    } catch (error) {
                        console.error('Error removing role:', error);
                    }
                }
            }

            const updatedTempRoles = tempRoles.filter(r => r.memberId !== member.id);
            await client.db.set(`tempRoles_${guildId}`, updatedTempRoles);

            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.tick} Successfully removed ${removedRoles} temporary role${removedRoles !== 1 ? 's' : ''} from <@${member.id}>.`
                    )
                ]
            });
        }

        if (args.length < 3) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} Invalid command usage.\n\`${message.guild.prefix}temprole <user> <role> <duration>\`\n\`${message.guild.prefix}temprole remove <user>\``
                    )
                ]
            });
        }

        let member = message.guild.members.cache.get(args[0]) || message.mentions.members.first();
        if (!member) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} Please mention a valid user.`
                    )
                ]
            });
        }

        let role = await findMatchingRoles(message.guild, args[1]);
        role = role[0];
        if (!role) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} Please provide a valid role.`
                    )
                ]
            });
        }

        const durationArg = args[2].toLowerCase();
        if (!durationArg.endsWith('m') && !durationArg.endsWith('h') && !durationArg.endsWith('d')) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} Invalid duration format. Please use:\n• m for minutes (e.g., 30m)\n• h for hours (e.g., 12h)\n• d for days (e.g., 7d)`
                    )
                ]
            });
        }

        const duration = ms(durationArg);
        if (!duration || isNaN(duration)) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} Please provide a valid duration (e.g., 1d, 12h, 30m)`
                    )
                ]
            });
        }
        const existingTempRoles = await client.db.get(`tempRoles_${guildId}`) || [];
        const hasExistingRole = existingTempRoles.some(r => 
            r.memberId === member.id && r.roleId === role.id
        );

        if (hasExistingRole) {
            const existingRole = existingTempRoles.find(r => 
                r.memberId === member.id && r.roleId === role.id
            );
            const timeLeft = existingRole.expiresAt - Date.now();
            let expiresIn;
            
            if (timeLeft < 60000) {
                expiresIn = `${Math.ceil(timeLeft / 1000)} seconds`;
            } else {
                const duration = moment.duration(timeLeft);
                const days = duration.days();
                const hours = duration.hours();
                const minutes = duration.minutes();
                const seconds = duration.seconds();
                
                let timeString = '';
                if (days > 0) timeString += `${days} days, `;
                if (hours > 0) timeString += `${hours} hours, `;
                if (minutes > 0) timeString += `${minutes} minutes, `;
                if (seconds > 0) timeString += `${seconds} seconds`;
                expiresIn = timeString.replace(/,\s*$/, '');
            }
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} The role <@&${role.id}> is already assigned as a temporary role to <@${member.id}>. It will expire in ${expiresIn}.`
                    )
                ]
            });
        }

        // const duration = ms(args[2]);
        // if (!duration || isNaN(duration)) {
        //     return message.channel.send({
        //         embeds: [
        //             embed.setDescription(
        //                 `${client.emoji.cross} Please provide a valid duration (e.g., 1d, 12h, 30m)`
        //             )
        //         ]
        //     });
        // }

        if (role.managed) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} This Role Is Managed By Integration`
                    )
                ]
            });
        }

        if (role.position >= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} I can't assign this role because my highest role is either lower than or equal to the specified role.`
                    )
                ]
            });
        }

        if (!own && !isSpecialMember && message.member.roles.highest.position <= role.position) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} I can't provide this role as your highest role is either below or equal to the provided role.`
                    )
                ]
            });
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

        if (admin && dangerousPermissions.some(permission => role.permissions.has(permission))) {
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} You are not supposed to give or remove roles with dangerous permissions.`
                    )
                ]
            });
        }
        try {
            await member.roles.add(role.id, `Temporary role by ${message.author.tag}(${message.author.id})`);
            const expiresAt = Date.now() + duration;
            
            existingTempRoles.push({
                memberId: member.id,
                roleId: role.id,
                guildId: guildId,
                expiresAt: expiresAt,
                addedById: message.author.id
            });
            
            await client.db.set(`tempRoles_${guildId}`, existingTempRoles);

            const durationFormatted = moment.duration(duration).format('d [days], h [hours], m [minutes]');
            
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.tick} Successfully added <@&${role.id}> to <@${member.id}> for ${durationFormatted}.`
                    )
                ]
            });
        } catch (error) {
            console.error('Error in temprole command:', error);
            return message.channel.send({
                embeds: [
                    embed.setDescription(
                        `${client.emoji.cross} An error occurred while setting the temporary role.`
                    )
                ]
            });
        }
    }
};

function findMatchingRoles(guild, query) {
    const ROLE_MENTION = /<?@?&?(\d{17,20})>?/;
    if (!guild || !query || typeof query !== 'string') return [];

    const patternMatch = query.match(ROLE_MENTION);
    if (patternMatch) {
        const id = patternMatch[1];
        const role = guild.roles.cache.find((r) => r.id === id);
        if (role) return [role];
    }

    const exact = [];
    const startsWith = [];
    const includes = [];
    guild.roles.cache.forEach((role) => {
        const lowerName = role.name.toLowerCase();
        if (role.name === query) exact.push(role);
        if (lowerName.startsWith(query.toLowerCase())) startsWith.push(role);
        if (lowerName.includes(query.toLowerCase())) includes.push(role);
    });
    if (exact.length > 0) return exact;
    if (startsWith.length > 0) return startsWith;
    if (includes.length > 0) return includes;
    return [];
}
