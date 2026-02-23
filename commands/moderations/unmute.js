const { MessageEmbed } = require('discord.js');
const Admin = require('../../models/admin');
const config = require('../../config.json')
module.exports = {
    name: 'unmute',
    aliases: ['untimeout'],
    category: 'mod',
    description: 'Removes the timeout for a member',
    premium: false,

    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const authorId = message.author.id;
        const isModerator = await client.db.get(`moderators_${guildId}`);
        const isMod = isModerator?.moderators?.includes(authorId);
        const adminId = message.member.id;
        let isSpecialMember = config.boss.includes(message.author.id);

        let admin = await Admin.findOne({ guildId, adminId });

        if (!isSpecialMember && !admin && !isMod && !message.member.permissions.has('MODERATE_MEMBERS')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have \`Timeout Members\` permissions to use this command.`)
                ]
            });
        }

        
        if (!message.guild.me.permissions.has('MODERATE_MEMBERS')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I must have \`Timeout Members\` permissions to run this command.`)
                ]
            });
        }

        
        let member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0])
        if (!member) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You didn't mentioned the member whom you want to unmute.`
                        )
                ]
            })
        }

        
        let reason = args.slice(1).join(' ').trim();
        if (!reason) reason = 'No Reason';
        reason = `${message.author.tag} (${message.author.id}) | ${reason}`;

        
        const response = await untimeout(message.member, member, reason, isMod, admin, isSpecialMember);
        await message.channel.send(response);
    }
};

async function untimeout(issuer, target, reason, isMod, admin, isSpecialMember) {
    const client = target.client;
    const response = await unTimeoutTarget(issuer, target, reason, isMod, admin, isSpecialMember);
    if (typeof response === 'boolean')
        return getEmbed(`${client.emoji.tick} Successfully unmuted <@${target.user.id}>!`, client);
    if (response === 'BOT_PERM')
        return getEmbed(`${client.emoji.cross} I don't have enough permissions to unmute <@${target.user.id}>.`, client);
    if (response === 'MEMBER_PERM')
        return getEmbed(`${client.emoji.cross} You don't have enough permissions to unmute <@${target.user.id}>.`, client);
    if (response === 'NO_TIMEOUT')
        return getEmbed(`${client.emoji.cross} <@${target.user.id}> is not muted!`, client);
    return getEmbed(`${client.emoji.cross} An error occurred while trying to unmute <@${target.user.id}>.`, client);
}

async function unTimeoutTarget(issuer, target, reason, isMod, admin, isSpecialMember) {
    if (!isSpecialMember && !isMod && !admin && !memberInteract(issuer, target)) return 'MEMBER_PERM';
    if (!memberInteract(issuer.guild.me, target)) return 'BOT_PERM';
    if (target.communicationDisabledUntilTimestamp - Date.now() < 0) return 'NO_TIMEOUT';

    try {
        await target.timeout(0, reason);
        return true;
    } catch (ex) {
        return 'ERROR';
    }
}

function memberInteract(issuer, target) {
    const { guild } = issuer;
    if (guild.ownerId === issuer.id) return true;
    if (guild.ownerId === target.id) return false;
    if (issuer.permissions.has('MODERATE_MEMBERS')) return true;
    return issuer.roles.highest.position > target.roles.highest.position;
}

function getEmbed(description, client) {
    return {
        embeds: [
            new MessageEmbed()
                .setColor(client.color)
                .setDescription(description)
        ]
    };
}
