const { MessageEmbed } = require("discord.js");
const moment = require("moment");

module.exports = {
    name: "userinfo",
    aliases: ['ui', 'whois'],
    category: 'info',
    description: "Get information about a user",
    run: async (client, message, args) => {
        const permissions = {
            "ADMINISTRATOR": "Administrator",
            "MANAGE_GUILD": "Manage Server",
            "MANAGE_ROLES": "Manage Roles",
            "MANAGE_CHANNELS": "Manage Channels",
            "KICK_MEMBERS": "Kick Members",
            "BAN_MEMBERS": "Ban Members",
            "MANAGE_NICKNAMES": "Manage Nicknames",
            "MANAGE_EMOJIS": "Manage Emojis",
            "MANAGE_WEBHOOKS": "Manage Webhooks",
            "MANAGE_MESSAGES": "Manage Messages",
            "MENTION_EVERYONE": "Mention Everyone"
        };

        let user = message.mentions.users.first() || message.author;

        if (args[0] && !message.mentions.users.first()) {
            try {
                user = await client.users.fetch(args[0]);
            } catch (error) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} | Please provide a valid user ID or mention a member.`
                            )
                    ]
                });
            }
        }

        const usericon = user.displayAvatarURL({ dynamic: true });

        let member = null;
        try {
            member = await message.guild.members.fetch(user.id);
        } catch (error) {
        }

        const flags = {
            "DISCORD_EMPLOYEE": "<:Orbitron_employee:1434986776035856444>",
            "DISCORD_PARTNER": "<:Userinfo_partner:1434981416369913866>",
            "BUGHUNTER_LEVEL_1": "<:Bughunter:1434981799963922432>",
            "BUGHUNTER_LEVEL_2": "<:Bughunter2:1434982351729070090>",
            "HYPESQUAD_EVENTS": "<a:Hyper_G:1434986413421629611>",
            "HOUSE_BRILLIANCE": "<:brilliance:1434986150782828707>",
            "HOUSE_BRAVERY": "<:DiscordHypesquadBravery:1434985960742846576>",
            "HOUSE_BALANCE": "<:balance:1434985738918690967>",
            "EARLY_SUPPORTER": "<a:EarlySupporter:1434985543917109339>",
            "TEAM_USER": "<:Team_user:1434985175485517894>",
            "VERIFIED_BOT": "<:verifiedbot:1434984859394117814>",
            "EARLY_VERIFIED_DEVELOPER": "<:Ui_developer:1434984518317641888>"
        };

        const userFlags = user.flags ? user.flags.toArray() : [];

        const userlol = new MessageEmbed()
            .setAuthor(`${user.username}'s Information`, usericon)
            .setThumbnail(usericon)
            .addField(`General Information`,
                `Name: \`${user.tag}\`\n` +
                `ID: \`${user.id}\`\n` +
                `Created On: ${moment(user.createdTimestamp).format('llll')}\n\n`
            )
            .addField(`Overview`,
                `Badges: ${userFlags.length ? userFlags.map(flag => flags[flag]).filter(Boolean).join(' ') : 'None'}\n` +
                `Type: ${user.bot ? 'Bot' : 'Human'}\n\n`
            );

        if (member) {
            const nick = member.nickname || "None";
            const topRole = member.roles.highest;
            const mentionPermissions = member.permissions.toArray();
            const finalPermissions = mentionPermissions.map(permission => permissions[permission]).filter(Boolean);

            userlol.addField(`Server Related Information`,
                `Nickname: \`${nick}\`\n` +
                `Joined Server: ${moment(member.joinedTimestamp).format('llll')}\n` +
                `Top Role: ${topRole}\n` +
                `Roles [${member.roles.cache.size - 1}]: ${member.roles.cache.size > 1 ? member.roles.cache.filter(r => r.id !== message.guild.id).map(role => role).join(', ') : 'None'}\n` +
                `Key Permissions: ${finalPermissions.length ? finalPermissions.map(permission => `\`${permission}\``).join(', ') : 'None'}\n\n`
            );
        }

        userlol.setColor(client.color)
            .setFooter(`Requested By: ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        message.channel.send({ embeds: [userlol] });
    }
};