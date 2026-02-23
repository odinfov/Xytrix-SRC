const {
    Message,
    Client,
    MessageEmbed
} = require('discord.js');
const config = require('../../config.json');
const { bannedUsers } = require('./vcban');
const Admin = require('../../models/admin');

module.exports = {
    name: 'vcunban',
    category: 'voice',
    aliases: [],
    description: `UnBan a user from connecting to voice channel.`,
    premium: false,
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let admin = await Admin.findOne({ guildId, adminId }); 
        let isSpecialMember = config.boss.includes(message.author.id);

        if (!admin && !isSpecialMember && !message.member.permissions.has('MOVE_MEMBERS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription('You must have `Move members` permission to use this command.');
            return message.channel.send({ embeds: [error] });
        }

        if (!message.guild.me.permissions.has('MOVE_MEMBERS')) {
            return message.channel.send({
                embeds: [new MessageEmbed().setColor(client.color).setDescription('I must have `Move members` permission to use this command.')]
            });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('You must mention someone whom you want to unban from voice channels.')
                ]
            });
        }

        let own = message.author.id == message.guild.ownerId;
        if (!admin && !isSpecialMember && !own && message.guild.me.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have a higher role than me to use this command.`)
                ]
            });
        }

        if (bannedUsers.has(guildId) && bannedUsers.get(guildId).has(member.user.id)) {
            bannedUsers.get(guildId).delete(member.user.id);
            
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`Successfully unbanned <@${member.user.id}> from voice channels!`)
                ]
            });
        } else {
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`<@${member.user.id}> is not banned from voice channels.`)
                ]
            });
        }
    }
};
