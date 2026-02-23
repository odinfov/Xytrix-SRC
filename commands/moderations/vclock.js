const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'vclock',
    category: 'mod',
    aliases: [],
    description: `Locks a voice channel. Usage: vclock [channelID]`,
    premium: false,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`You must have \`Manage Channels\` permission to use this command.`)]
            });
        }

        let channelId = args[0] || message.channel.id;
        let channel = message.guild.channels.cache.get(channelId);

        if (!channel) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`Couldn't find a channel with the ID: ${channelId}`)]
            });
        }

        if (channel.type !== 'GUILD_VOICE') {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`The specified channel is not a voice channel.`)]
            });
        }

        if (!channel.manageable) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`I don't have adequate permissions to lock this voice channel.`)]
            });
        }

        channel.permissionOverwrites.edit(message.guild.id, {
            CONNECT: false
        }, { reason: `${message.author.tag} (${message.author.id})` });

        return message.channel.send({
            embeds: [new MessageEmbed()
                .setDescription(`${client.emoji.tick} **${channel.name}** has been successfully locked for @everyone.`)
                .setColor(client.color)]
        });
    }
};
