const { MessageEmbed } = require('discord.js')
const config = require('../../config.json')

module.exports = {
    name: 'unwhitelist',
    aliases: ['uwl'],
    description: `Removes users from the server's whitelist.`,
    category: 'security',
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
            })
        }
        let own = message.author.id == message.guild.ownerId
        const check = await client.util.isExtraOwner(
            message.author,
            message.guild
        )
        if (!isSpecialMember && !own && !check) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Apologies, but only the server owner or an extra owner with a higher role than mine can use this command.`
                        )
                ]
            })
        }
        if (
            !isSpecialMember && !own &&
            !(
                message?.guild.members.cache.get(client.user.id).roles.highest
                    .position <= message?.member?.roles?.highest.position
            )
        ) {
            const higherole = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `${client.emoji.cross} Only the server owner or extra owner with a higher role than mine can execute this command.`
                )
            return message.channel.send({ embeds: [higherole] })
        }

        if (args.length === 0) {
            const uwl = new MessageEmbed()
                .setColor(client.color)
                .setTitle(`__**Unwhitelist Commands**__`)
                .setDescription(
                    `**Removes user from whitelisted users which means that there will be proper actions taken on the members if they trigger the antinuke module.**`
                )
                .addFields([
                    {
                        name: `__**Usage**__`,
                        value: `•  \`${message.guild.prefix}unwhitelist @user/id\`\n•  \`${message.guild.prefix}uwl @user\``
                    }
                ])
            return message.channel.send({ embeds: [uwl] })
        }

        const antinuke = await client.db.get(`${message.guild.id}_antinuke`)
        if (!antinuke) {
            const dissable = new MessageEmbed().setColor(client.color)
                .setDescription(` ** ${message.guild.name} security settings Ohh NO! looks like your server doesn't enabled security

Current Status : <a:Xytrix_disable:1431277129441742874> <:Xytrix_enable2:1431277725015998558> To enable use antinuke enable ** `)
            return message.channel.send({ embeds: [dissable] })
        }

        if (args[0] && args[0].match(/<@!?(\d+)>/) && args[0].match(/<@!?(\d+)>/)[1] === client.user.id) {
            args.shift();
        }
        let userMention = message.mentions.users.first()
        let userId = args[0]
        if (userMention && userMention.id === client.user.id && message.mentions.users.size > 1) {
            userMention = Array.from(message.mentions.users.values())[1];
        }

        let user = userMention || 
                  (userId ? await client.users.fetch(userId).catch(() => null) : null)
        if (!user && userId) {
            if (userId.match(/<@!?(\d+)>/)) {
                userId = userId.match(/<@!?(\d+)>/)[1];
            }
            const isWhitelisted = await client.db.has(`${message.guild.id}_${userId}_wl`);
            
            if (isWhitelisted) {
                user = { id: userId };
            }
        }

        if (!user) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Please provide a valid user mention or ID.`
                        )
                ]
            })
        }

        let has = await client.db.has(
            `${message.guild.id}_${user.id}_wl`,
            {
                ban: false,
                kick: false,
                prune: false,
                botadd: false,
                serverup: false,
                memup: false,
                chcr: false,
                chup: false,
                chdl: false,
                rlcr: false,
                rldl: false,
                rlup: false,
                meneve: false,
                mngweb: false,
                mngstemo: false
            }
        )

        if (!has) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} <@${user.id}> is not a whitelisted member.`
                        )
                ]
            })
        }

        await client.db.pull(
            `${message.guild.id}_wl.whitelisted`,
            user.id
        )
        await client.db.delete(
            `${message.guild.id}_${user.id}_wl`
        )
        return message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(
                        `${client.emoji.tick} Successfully removed <@${user.id}> from whitelisted user.`
                    )
            ]
        })
    }
}
