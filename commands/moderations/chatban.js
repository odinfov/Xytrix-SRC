const { Message, Client, MessageEmbed } = require('discord.js');
const Admin = require('../../models/admin');
const config = require('../../config.json')

module.exports = {
    name: 'chatban',
    aliases: ['cban', 'mutechat'],
    category: 'mod',
    description: 'Locks the channel for the specified user from sending messages.',
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
        let isSpecialMember = config.boss.includes(message.author.id);

        let admin = await Admin.findOne({ guildId, adminId });

        if (!isSpecialMember && !admin && !message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Manage Channels\` permissions to use this command.`
                        )
                ]
            });
        }

        
        let user;
        try {
            user = await getUserFromMention(message, args[0]) || await client.users.fetch(args[0]);
        } catch (err) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please provide a valid user ID or mention.`)
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

        if (member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You cannot chat ban any member with Administrator permission.`)
                ]
            });
        }

        const activeAdmins = await Admin.find({ guildId });
        const targetAdminId = user.id;
        const targetAdmin = activeAdmins.find(a => a.adminId === targetAdminId);

        if (targetAdmin && !isSpecialMember) {
            const targetMember = member;
            const executorMember = message.member;

            if (targetMember.roles.highest.position >= executorMember.roles.highest.position) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} You cannot chat ban an admin with equal or higher role than you.`)
                    ]
                });
            }
        }

        const overwrite = message.channel.permissionOverwrites.cache.get(member.id);
        if (overwrite && overwrite.deny.has('SEND_MESSAGES')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} This user is already banned from sending messages in this channel.`)
                ]
            });
        }

        if (member.roles.highest.position >= message.guild.me.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I cannot chat ban a member with equal or higher role than me.`)
                ]
            });
        }

        try {
            await message.channel.permissionOverwrites.edit(member.id, {
                SEND_MESSAGES: false
            });

            const successEmbed = new MessageEmbed()
                .setDescription(
                    `${client.emoji.tick} Successfully banned **<@${member.id}>** from sending messages in this channel.`
                )
                .setColor(client.color);
            message.channel.send({ embeds: [successEmbed] });
        } catch (err) {
            console.error(err);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I couldn't lock the channel for the user.`)
                ]
            });
        }
    }
};

async function getUserFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return null;

    const id = matches[1];
    return await message.client.users.fetch(id);
}