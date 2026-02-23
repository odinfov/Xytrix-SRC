const { MessageEmbed } = require('discord.js');
const config = require('../../config.json');
module.exports = {
    name: 'whitelistchannel',
    aliases: ['wlchannel', 'wlch'],
    description: 'Manage the whitelist channels where members can mention everyone and roles.',
    category: 'security',
    subcommand: ['add', 'remove', 'list', `reset`],
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && message.guild.memberCount < 30) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Your server must have at least 30 members to use this feature.`
                        )
                ]
            });
        }
        let own = message.author.id == message.guild.ownerId;
        const tick = await client.util.isExtraOwner(message.author, message.guild);
        if (!isSpecialMember && !own && !tick) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Only the server owner or an extra owner can use this command.`)
                ]
            });
        }
        const subCommand = args[0]?.toLowerCase();
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        let whitelist = await client.db.get(`${message.guild.id}_whitelist_channels`) || [];
        const isPremium = await client.db.get(`sprem_${message.guild.id}`);
        let limit = isPremium ? 5 : 1;
        
        if (subCommand === 'add') {
            if (!channel) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} Please mention a valid channel or provide a valid channel ID.`)
                    ]
                });
            }

            if (channel.type === 'GUILD_VOICE') {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} You cannot use this command for voice channels.`)
                    ]
                });
            }
            
            if (whitelist.includes(channel.id)) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} This channel is already whitelisted.`)
                    ]
                });
            }
            if (whitelist.length >= limit) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} You can only whitelist up to ${limit} channels.`)
                    ]
                });
            }
            whitelist.push(channel.id);
            await client.db.set(`${message.guild.id}_whitelist_channels`, whitelist);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.tick} Successfully whitelisted <#${channel.id}>.`)
                ]
            });
        } else if (subCommand === 'remove') {
            if (!channel) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} Please mention a valid channel or provide a valid channel ID.`)
                    ]
                });
            }
            if (!whitelist.includes(channel.id)) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} This channel is not whitelisted.`)
                    ]
                });
            }
            whitelist = whitelist.filter(id => id !== channel.id);
            await client.db.set(`${message.guild.id}_whitelist_channels`, whitelist);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.tick} Successfully removed <#${channel.id}> from the whitelist.`)
                ]
            });
        } else if (subCommand === 'list') {
            if (whitelist.length === 0) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} No channels are currently whitelisted.`)
                    ]
                });
            }

            const displayedChannels = whitelist.slice(0, limit);
            
            let description = displayedChannels.map(id => `<#${id}>`).join('\n');

            if (!isPremium && whitelist.length > 1) {
                description += `\n\n**Note: **Your Premium subscription has expired!\nUpgrade now to unlock all the exclusive features and enjoy up to 5 whitelisted channels.`;
            }
            
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setTitle('Whitelisted Channels')
                        .setDescription(description)
                ]
            });
        } else if (subCommand === 'reset') {
            await client.db.delete(`${message.guild.id}_whitelist_channels`);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.tick} Successfully reset all whitelisted channels.`)
                ]
            });
        } else {
            let prefix = '&' || message.guild.prefix
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setThumbnail(client.user.avatarURL({ dynamic: true }))
                        .setColor(client.color)
                        .setTitle(`__**Whitelist Channel**__`)
                        .setDescription(
                            `Manage channels that are whitelisted in your server with the Whitelist Channel feature! This tool allows you to add, remove, and list whitelisted channels, ensuring better control and security over your server's content. You can easily reset the entire whitelist as well.`
                        )
                        .addFields([
                            {
                                name: `__**Whitelist Channel Add**__`,
                                value: `To add a channel - \`${prefix}whitelistchannel add <channel>\``
                            },
                            {
                                name: `__**Whitelist Channel Remove**__`,
                                value: `To remove a channel - \`${prefix}whitelistchannel remove <channel>\``
                            },
                            {
                                name: `__**Whitelist Channel List**__`,
                                value: `To list all whitelisted channels - \`${prefix}whitelistchannel list\``
                            },
                            {
                                name: `__**Whitelist Channel Reset**__`,
                                value: `To reset all whitelisted channels - \`${prefix}whitelistchannel reset\``
                            }
                        ])
                ]
            });
        }
    }
};
