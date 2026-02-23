const { Message, Client, MessageEmbed, Permissions } = require('discord.js');
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
const config = require('../../config.json')

module.exports = {
    name: 'sanatise',
    aliases: ['cleanperms', 'sanitize'],
    category: 'mod',
    description: 'Removes dangerous permissions from the specified user.',
    premium: false,

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        if (!args[0]) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please provide a valid user ID or mention.`)
                ]
            });
        }
        let isSpecialMember = config.boss.includes(message.author.id);;

        if (!isSpecialMember && !message.member.permissions.has('MANAGE_ROLES')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Manage Roles\` permissions to use this command.`
                        )
                ]
            });
        }

        let user = await getUserFromMentionOrID(client, args[0]);
        
        if (!user) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please provide a valid user ID or mention.`)
                ]
            });
        }
        
        let own = message.author.id == message.guild.ownerId;
        if (
            !isSpecialMember && !own &&
            message.member.roles.highest.position <=
                message.guild.me.roles.highest.position
        ) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have a higher role than me to use this command.`
                        )
                ]
            });
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} The user is not in this server.`)
                ]
            });
        }

        let resetRoles = [];
        let removedRoles = [];
        let unremovableRoles = [];

        try {
            for (let role of member.roles.cache.values()) {
                
                if (role.permissions.has(dangerousPermissions)) {
                    
                    if (role.tags?.botId === user.id) {
                        try {
                            
                            await role.setPermissions([]);
                            resetRoles.push(role);
                        } catch (error) {
                            if (error.code === 50013) {
                                unremovableRoles.push(`<@&${role.id}>`);
                            } else {
                                throw error;
                            }
                        }
                    } else {
                        
                        try {
                            await member.roles.remove(role);
                            removedRoles.push(role);
                        } catch (error) {
                            if (error.code === 50013) {
                                unremovableRoles.push(`<@&${role.id}>`);
                            } else {
                                throw error;
                            }
                        }
                    }
                }
            }

            if (resetRoles.length > 0 || removedRoles.length > 0 || unremovableRoles.length > 0) {
                const successEmbed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Dangerous permissions have been handled for **<@${member.id}>**.`);

                if (resetRoles.length > 0) {
                    successEmbed.addField(
                        'Roles with Reset Permissions',
                        `The following integration roles had dangerous permissions reset: ${resetRoles.map(role => `<@&${role.id}>`).join(', ')}.`
                    );
                }

                if (removedRoles.length > 0) {
                    successEmbed.addField(
                        'Roles Removed',
                        `The following roles were removed due to dangerous permissions: ${removedRoles.map(role => `<@&${role.id}>`).join(', ')}.`
                    );
                }

                if (unremovableRoles.length > 0) {
                    successEmbed.addField(
                        'Unremovable Roles',
                        `The following roles could not be modified due to role hierarchy or missing permissions: ${unremovableRoles.join(', ')}.`
                    );
                }

                message.channel.send({ embeds: [successEmbed] });
            } else {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} The user does not have any dangerous permissions that can be handled.`)
                    ]
                });
            }
        } catch (err) {
            console.error(err);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I couldn't handle the permissions for the user.`)
                ]
            });
        }
    }
};

async function getUserFromMentionOrID(client, input) {
    
    const mentionMatches = input.match(/^<@!?(\d+)>$/);
    if (mentionMatches) {
        const id = mentionMatches[1];
        return await client.users.fetch(id);
    }
    
    
    if (!isNaN(input)) {
        try {
            return await client.users.fetch(input);
        } catch {
            return null;
        }
    }

    return null;
}
