const {
    Message,
    Client,
    MessageEmbed
} = require('discord.js');
const config = require('../../config.json');
const { bannedUsers } = require('./vcban');
const Admin = require('../../models/admin');

module.exports = {
    name: 'vcunbanall',
    category: 'voice',
    aliases: [],
    description: 'Unban all users from voice channels in the server',
    premium: false,
    cooldown: 30,
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let own = message.author.id === message.guild.ownerId;
        let isSpecialMember = config.boss.includes(message.author.id);

        let admin = await Admin.findOne({ guildId, adminId });

        if (!isSpecialMember && !admin && !message.member.permissions.has('MOVE_MEMBERS')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have \`Move members\` permissions to use this command.`)
                ]
            });
        }

        if (!message.guild.me.permissions.has('MOVE_MEMBERS')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I must have \`MOVE_MEMBERS\` permissions to run this command.`)
                ]
            });
        }

        if (!isSpecialMember && !admin && !own && client.util.hasHigher(message.member) == false) {
            let error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`Your highest role must be higher than my highest role to use this command.`);
            return message.channel.send({ embeds: [error] });
        }

        if (!bannedUsers.has(guildId) || bannedUsers.get(guildId).size === 0) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} There are no voice banned users in this server.`)
                ]
            });
        }

        const fetchEmbed = await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`🔄 | Fetching voice banned users, please wait...`)
            ]
        });

        await sleep(800);

        fetchEmbed.edit({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Successfully started unbanning all users from voice channels...`)
            ]
        });

        let unbanCount = 0;
        const bannedUsersList = Array.from(bannedUsers.get(guildId).keys());

        for (const userId of bannedUsersList) {
            try {
                bannedUsers.get(guildId).delete(userId);
                unbanCount++;
                await sleep(3000);
            } catch (error) {
                console.error(`Failed to unban user ${userId}:`, error);
                if (error.code === 429) { 
                    await sleep(10000);
                }
            }
        }

        await message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Successfully unbanned ${unbanCount} user(s) from voice channels!`)
            ]
        });
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
