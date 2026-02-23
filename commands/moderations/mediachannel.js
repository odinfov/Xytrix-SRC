const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'mediachannel',
    aliases: ['media'],
    category: 'mod',
    description: `Setup channels to be used only for sending media`,
    subcommand: ['set', 'reset', 'view', 'bypass'],
    premium: false,
    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_GUILD')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`MANAGE SERVER\` permissions to use this command.`
                        )
                ]
            });
        }
        if (!message.guild.me.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I don't have \`Administrator\` permissions to execute this command.`
                        )
                ]
            });
        }

        const hasHigherRole = client.util.hasHigher(message.member);
        let own = message.author.id == message.guild.ownerId;
        if (!own && !isSpecialMember && !hasHigherRole) {
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

        
        const isPremium = await client.db.get(`sprem_${message.guild.id}`); 
        let limit = isPremium ? 2 : 1;

        const option = args[0];

        const media = new MessageEmbed()
            .setThumbnail(client.user.avatarURL({ dynamic: true }))
            .setColor(client.color)
            .setTitle(`__**Media (5) **__`)
            .addFields([
                { name: `__**media**__`, value: `Configures the media only channels !` },
                { name: `__**media set**__`, value: `Setup media only channel in server` },
                { name: `__**media reset**__`, value: `Disable media only channels configured in server` },
                { name: `__**media view**__`, value: `Shows the media only channels` },
                { name: `__**media bypass**__`, value: `Set a role to bypass media only restriction` }
            ]);

        if (!option) {
            return message.channel.send({ embeds: [media] });
        } else if (option.toLowerCase() === 'set') {
            const channel = getChannelFromMention(message, args[1]) || message.guild.channels.cache.get(args[1]);

            if (!channel) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} Oops! It seems there was an issue. Please make sure to provide a valid channel for the media configuration.`
                            )
                    ]
                });
            }
            if (channel.type === 'GUILD_VOICE') {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} You cannot add any voice channels as media channel.`
                            )
                    ]
                });
            }
            let data = await client.db.get(`mediachannel_${message.guild.id}`) || { channels: [] };
            if (data.channels.includes(channel.id)) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} ${channel} is already configured as a media-only channel.`
                            )
                    ]
                });
            }            
            if (data.channels.length >= limit) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} You have reached the limit of ${limit} media channels.`
                            )
                    ]
                });
            }
            data.channels.push(channel.id);
            await client.db.set(`mediachannel_${message.guild.id}`, data);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully Added ${channel} As Media Only Channel.`
                        )
                ]
            });
        } else if (option.toLowerCase() === 'reset') {
            await client.db.set(`mediachannel_${message.guild.id}`, { channels: [] });
            await client.db.set(`mediabypass_${message.guild.id}`, { role: null }); 
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully Disabled Media Only Configuration.`
                        )
                ]
            });
        } else if (option.toLowerCase() === 'view') {
            const mediaData = await client.db.get(`mediachannel_${message.guild.id}`);
            const bypassData = await client.db.get(`mediabypass_${message.guild.id}`);
            const bypassRole = bypassData?.role ? `<@&${bypassData.role}>` : 'None';
            
            if (!mediaData?.channels?.length) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} No Media Only Configuration Is Set.`
                            )
                    ]
                });
            }

            const displayedChannels = isPremium ? mediaData.channels : mediaData.channels.slice(0, 1);
            let description = `Current media only configured channels are ${displayedChannels.map(id => `<#${id}>`).join(', ')}\n\nBypass Role: ${bypassRole}`;

            if (!isPremium && (mediaData.channels.length > 1 || bypassData?.role)) {
                description += `\n\n**Note: **Your Premium subscription has expired!\nUpgrade now to unlock all the exclusive features and enjoy unlimited access to media channels and bypass roles.`;
            }
            
            const whitelisted = new MessageEmbed()
                .setColor(client.color)
                .setDescription(description);
                
            return message.channel.send({ embeds: [whitelisted] });
        } else if (option.toLowerCase() === 'bypass') {
            if (!isPremium) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} The bypass command is only available to premium servers.`
                            )
                    ]
                });
            }            
            const role = getRoleFromMention(message, args[1]) || message.guild.roles.cache.get(args[1]);

            if (!role) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} Oops! It seems there was an issue. Please make sure to provide a valid role for the bypass configuration.`
                            )
                    ]
                });
            }
            await client.db.set(`mediabypass_${message.guild.id}`, { role: role.id });
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully Added ${role} As Media Bypass Role.`
                        )
                ]
            });
        }
    }
};

function getChannelFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<#(\d+)>$/);
    if (!matches) return null;

    const channelId = matches[1];
    return message.guild.channels.cache.get(channelId);
}

function getRoleFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@&(\d+)>$/);
    if (!matches) return null;

    const roleId = matches[1];
    return message.guild.roles.cache.get(roleId);
}
