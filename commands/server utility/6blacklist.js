const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const BlacklistChannel = require('../../models/blacklistchannel');
const config = require('../../config.json')
module.exports = {
    name: 'blacklistchannel',
    aliases: ['blchannel'],
    description: 'Blacklists a channel , where I wont count messages from that channel',
    category: 'serveru',
    subcommand: ['add', 'remove', 'list', 'reset'],
    cooldown: 5,
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
            if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} You must have \`Administrator\` permissions to use this command.`
                            )
                    ]
                });
            }
        let prefix = message.guild.prefix
        if (!args[0]) {
            embed = new MessageEmbed()
                .setTitle('Blacklist Channel')
                .setDescription('Manage channels that are blacklisted from counting messages.')
                .setColor(client.color)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Add Blacklist Channel', value: `To add blacklist channel, use \`${prefix}blacklistchannel add\``},
                    { name: 'Remove Blacklist Channel', value: `To remove blacklisted channel, use \`${prefix}blacklistchannel remove\``},
                    { name: 'List Blacklist Channels', value: `To check blacklisted channel, use \`${prefix}blacklistchannel list\``},
                    { name: 'Reset Blacklist Channels', value: `To reset blacklisted channel, use \`${prefix}blacklistchannel reset\``}
                )
                return message.channel.send({ embeds: [embed] });
            }

        const action = args[0].toLowerCase();

        switch (action) {
            case 'add': {
                const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
                if (!channel) {
                    embed = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please mention a channel or provide a valid channel ID.`);
                        return message.channel.send({ embeds: [embed] });
                }

                const existing = await BlacklistChannel.findOne({ 
                    guildId: message.guild.id, 
                    channelId: channel.id 
                });

                if (existing) {
                    embed = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} This channel is already blacklisted.`);
                    return message.channel.send({ embeds: [embed] });
                }

                const blacklistChannel = new BlacklistChannel({
                    guildId: message.guild.id,
                    channelId: channel.id
                });

                await blacklistChannel.save();
                embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Successfully added ${channel} to the blacklist`);
                return message.channel.send({ embeds: [embed] });
            }

            case 'remove': {
                const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
                if (!channel) {
                    embed = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please mention a channel or provide a valid channel ID.`);
                    return message.channel.send({ embeds: [embed] });
                }

                const deleted = await BlacklistChannel.findOneAndDelete({
                    guildId: message.guild.id,
                    channelId: channel.id
                });

                if (!deleted) {
                    embed = new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} This channel is not blacklisted.`);
                    return message.channel.send({ embeds: [embed] });
                }

                embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Successfully removed ${channel} from the blacklist`);
                return message.channel.send({ embeds: [embed] });

            }

            case 'list': {
                const blacklistedChannels = await BlacklistChannel.find({ guildId: message.guild.id });
            
                const embed = new MessageEmbed()
                    .setTitle('Blacklisted Channels')
                    .setColor(client.color)
            
                if (blacklistedChannels.length === 0) {
                    embed.setDescription(`${client.emoji.cross} No channels are blacklisted.`);
                } else {
                    embed.setDescription(blacklistedChannels.map(ch => `<#${ch.channelId}>`).join('\n'));
                }
            
                return message.channel.send({ embeds: [embed] });
            }

            case 'reset': {
                await BlacklistChannel.deleteMany({ guildId: message.guild.id });
                embed = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.tick} Successfully reset the blacklist channels.`);
                    return message.channel.send({ embeds: [embed] });
            }

            default:
                embed = new MessageEmbed()
                .setTitle('Blacklist Channel')
                .setDescription('Manage channels that are blacklisted from counting messages.')
                .setColor(client.color)
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Add Blacklist Channel', value: `To add blacklist channel, use \`${prefix}blacklistchannel add\``},
                    { name: 'Remove Blacklist Channel', value: `To remove blacklisted channel, use \`${prefix}blacklistchannel remove\``},
                    { name: 'List Blacklist Channels', value: `To check blacklisted channel, use \`${prefix}blacklistchannel list\``},
                    { name: 'Reset Blacklist Channels', value: `To reset blacklisted channel, use \`${prefix}blacklistchannel reset\``}
                )
                return message.channel.send({ embeds: [embed] });
        }
    }
};
