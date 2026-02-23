const { Message, Client, MessageEmbed } = require('discord.js');
const Admin = require('../../models/admin');
const config = require('../../config.json')

module.exports = {
    name: 'kick',
    aliases: ['hackkick', 'fuckkick', 'fuckoff'],
    category: 'mod',
    description: `kicks the specified user from the server.`,
    premium: false,

    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let isSpecialMember = config.boss.includes(message.author.id);

        let admin = await Admin.findOne({ guildId, adminId });

        if (!isSpecialMember && !admin && !message.member.permissions.has('KICK_MEMBERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Kick Members\` permissions to use this command.`
                        )
                ]
            });
        }

        if (!message.guild.me.permissions.has('KICK_MEMBERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I must have \`Kick Members\` permissions to use this command.`
                        )
                ]
            });
        }

        let user = await getUserFromMention(message, args[0]);
        if (!user) {
            try {
                user = await client.users.fetch(args[0]);
            } catch (error) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} Please Provide Valid user ID or Mention Member.`)
                    ]
                });
            }
        }

        const activeAdmins = await Admin.find({ guildId });
        const targetAdminId = user.id;
        const targetAdmin = activeAdmins.find(a => a.adminId === targetAdminId);

        if (targetAdmin && !isSpecialMember) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You cannot kick an admin member in this server. Ask your higher to kick them.`
                        )
                ]
            });
        }

        const hasHigherRole = client.util.hasHigher(message.member);

        if (!isSpecialMember && !admin && !hasHigherRole) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have a role higher than the bot to use this command.`
                        )
                ]
            });
        } else if (admin) {
            const now = new Date();
            const oneDay = 24 * 60 * 60 * 1000; 
            if ((now - admin.lastKick) > oneDay) {
                admin.kicksToday = 0;
                admin.lastKick = now;
            }

            if (admin.kicksToday >= 5) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} You have reached the kick limit for today.`)
                    ]
                });
            }
        }

        let rea = args.slice(1).join(' ') || 'No Reason Provided';
        rea = `${message.author.tag} (${message.author.id}) | ` + rea;

        if (user === undefined) return message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setDescription(`${client.emoji.cross} User Not Found`)
                    .setColor(client.color)
            ]
        });

        if (user.id === client.user.id) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} If You kick Me Then Who Will Protect Your Server Dumb!?`)
                ]
            });
        }

        if (user.id === message.guild.ownerId) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I can't kick the owner of this server.`)
                ]
            });
        }

        let check = message.guild.members.cache.has(user.id);
        if (check === true || user.kickable) {
            try {
                const kickmess = new MessageEmbed()
                    .setAuthor(
                        message.author.tag,
                        message.author.displayAvatarURL({ dynamic: true })
                    )
                    .setDescription(
                        `You Have Been Kicked From ${message.guild.name} \nExecutor : ${message.author.tag} \nReason : \`${rea}\``
                    )
                    .setColor(client.color)
                    .setThumbnail(
                        message.author.displayAvatarURL({ dynamic: true })
                    );
                let member = await message.guild.members.fetch(user.id, true);
                await message.guild.members.kick(member.id, {
                    reason: rea
                });
                await member.send({ embeds: [kickmess] }).catch((err) => null);
            } catch (err) {
                const embed = new MessageEmbed()
                    .setDescription(
                        `${client.emoji.cross} My highest role is below **<@${user.id}>**`
                    )
                    .setColor(client.color);
                return message.channel.send({ embeds: [embed] });
            }
            const done = new MessageEmbed()
                .setDescription(
                    `${client.emoji.tick} Successfully kicked **<@${user.id}>** from the server.`
                )
                .setColor(client.color);
            message.channel.send({ embeds: [done] });

            if (admin) {
                admin.kicksToday += 1;
                await admin.save();
            }
            return;
        }
    }
};

function getUserFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return null;

    const id = matches[1];
    return message.client.users.fetch(id);
}