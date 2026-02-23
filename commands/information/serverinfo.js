const { MessageEmbed } = require('discord.js')
const moment = require('moment')
const verificationLevels = {
    NONE: 'None',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    VERY_HIGH: 'Very High'
}
const booster = {
    NONE: 'Level 0',
    TIER_1: 'Level 1',
    TIER_2: 'Level 2',
    TIER_3: 'Level 3'
}
const disabled = '<:Xytrix_no:1430998925308858369>'
const enabled = '<:Xytrix_yes:1430998886494896240>'

module.exports = {
    name: 'serverinfo',
    category: 'info',
    aliases: ['si'],
    description: 'To Get Information About The Server',
    premium: false,
    run: async (client, message, args) => {
        this.client = client
        const guild = message.guild
        const { createdTimestamp, ownerId, description } = guild

        const roles = guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map((role) => role.toString())
            .slice(0, -1)
        let rolesdisplay
        if (roles.length < 15) {
            rolesdisplay = roles.join(' ')
            if (roles.length < 1) rolesdisplay = 'None'
        } else {
            rolesdisplay = `\`Too many roles to show..\``
        }
        if (rolesdisplay.length > 1024)
            rolesdisplay = `${roles.slice(4).join(' ')} \`more..\``
        const members = guild.members.cache
        const channels = guild.channels.cache
        const emojis = guild.emojis.cache
        
        let bannerURL;
        if (guild.banner) {
            let format = guild.banner.startsWith('a_') ? 'gif' : 'png';
            bannerURL = guild.bannerURL({ format: format, size: 4096 });
        }
        
        let bans = await guild.bans.fetch().then((x) => x.size)
        const premiumRole = guild.roles.cache.find(role => role.tags && role.tags.premiumSubscriberRole) || null;

        const embed = new MessageEmbed()
            .setColor(this.client.color)
            .setTitle(`${guild.name}'s Information`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields([
                {
                    name: '__About__',
                    value: `> **Name**: ${guild.name} \n > **ID**: ${guild.id} \n > **Owner <a:Xytrix_Owner:1431012278781870192>:** <@!${ownerId}> (${ownerId})\n > **Created at:** <t:${parseInt(createdTimestamp / 1000)}:R>\n > **Members: **${guild.memberCount}\n > **Banned Members: **${bans}`
                },
                {
                    name: '__Server Information__',
                    value: `> **Verification Level:** ${verificationLevels[guild.verificationLevel]}\n > **Inactive Channel: **${guild.afkChannelId ? `<#${guild.afkChannelId}>` : `${disabled}`}\n > **Inactive Timeout: **${guild.afkTimeout / 60} mins\n > **System Messages Channel: **${guild.systemChannelId ? `<#${guild.systemChannelId}>` : disabled}\n > **Boost Bar Enabled: **${guild.premiumProgressBarEnabled ? enabled : disabled}`
                },
                {
                    name: '__Description__',
                    value: `> **${description || 'No server description.'}**`,
                },                            
                {
                    name: '__Channels__',
                    value: `> **Text: **<:Xytrix_text:1433949954682130545> ${channels.filter((channel) => channel.type === 'GUILD_TEXT').size}\n > **Voice:** <:Xytrix_voice:1430992734042329108> ${channels.filter((channel) => channel.type === 'GUILD_VOICE').size}\n > **Total: ** ${channels.size}\n`
                },
                {
                    name: '__Emoji Info__',
                    value: `> **Regular:** ${emojis.filter((emoji) => !emoji.animated).size} \n > **Animated:** ${emojis.filter((emoji) => emoji.animated).size} \n> **Total:** ${emojis.size}`
                },
                {
                    name: '__Boost Status__',
                    value: `> **Count:** ${guild.premiumSubscriptionCount || '0'} <a:Xytrix_boost:1431296205035540542> \n > **Level:** ${booster[guild.premiumTier]}\n > **Role:** ${premiumRole ? `<@&${premiumRole.id}>` : 'None'}`
                },
                {
                    name: `__Server Roles__ [${roles.length}]`,
                    value: `> ${rolesdisplay}`
                }
            ])
            .setFooter({ 
                text: `Requested by ${message.author.tag}`, 
                iconURL: message.author.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp()

        if (bannerURL) {
            embed.setImage(bannerURL)
        }

        return message.channel.send({ embeds: [embed] })
    }
}
