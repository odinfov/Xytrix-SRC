const {
    MessageEmbed
} = require('discord.js');
const config = require('../../config.json')
const Admin = require('../../models/admin');
module.exports = {
    name: 'vcmoveall',
    category: 'voice',
    aliases: [],
    description: `Moves all users from one voice channel to another.`,
    premium: false,
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let admin = await Admin.findOne({ guildId, adminId }); 
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!admin && !isSpecialMember && !message.member.permissions.has('MOVE_MEMBERS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `You must have \`Move members\` permission to use this command.`
                );
            return message.channel.send({
                embeds: [error]
            });
        }
        if (!message.guild.me.permissions.has('MOVE_MEMBERS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `I must have \`Move members\` permission to use this command.`
                );
            return message.channel.send({
                embeds: [error]
            });
        }
        if (!message.member.voice.channel) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `You must be connected to a voice channel first.`
                        )
                ]
            });
        }

        let channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]);
        if (!channel || channel.type !== 'GUILD_VOICE') {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `Invalid or non-existent voice channel provided.`
                        )
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
        try {
            let i = 0;
            message.member.voice.channel.members.forEach(async (member) => {
                i++;
                member.voice.setChannel(channel.id,`${message.author.tag} | ${message.author.id}`);
                await client.util.sleep(1000)

            });
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully Moved ${i} Members to ${channel}!`
                        )
                ]
            });
        } catch (err) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `I don't have the required permissions to move members to ${channel}.`
                        )
                ]
            });
        }
    }
};
