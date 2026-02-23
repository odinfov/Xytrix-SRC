const ms = require('ms');
const moment = require('moment');
require('moment-duration-format');

module.exports.tempban = {
    name: 'tempban',
    aliases: ['tban', 'timeban'],
    category: 'mod',
    subcommand: ['remove'],
    description: `Temporarily bans the specified user from the server.`,
    premium: false,

    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let isSpecialMember = config.boss.includes(message.author.id);
        let admin = await Admin.findOne({ guildId, adminId });       

        if (!isSpecialMember && !admin && !message.member.permissions.has('BAN_MEMBERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Ban Members\` permissions to use this command.`
                        )
                ]
            });
        }

        if (!message.guild.me.permissions.has('BAN_MEMBERS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} I must have \`Ban Members\` permissions to use this command.`
                        )
                ]
            });
        }

        if (args[0]?.toLowerCase() === 'remove') {
            if (!args[1]) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} Please provide a user ID to unban.`)
                    ]
                });
            }

            const userId = args[1].replace(/[<@!>]/g, '');
            const tempBans = await client.db.get(`tempBans_${guildId}`) || [];
            const banData = tempBans.find(b => b.userId === userId);

            if (!banData) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} This user is not temporarily banned.`)
                    ]
                });
            }

            try {
                await message.guild.members.unban(userId, `Temporary ban removed by ${message.author.tag}`);
                const updatedTempBans = tempBans.filter(b => b.userId !== userId);
                await client.db.set(`tempBans_${guildId}`, updatedTempBans);

                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.tick} Successfully removed temporary ban for <@${userId}>.`)
                    ]
                });
            } catch (error) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} An error occurred while removing the temporary ban.`)
                    ]
                });
            }
        }

        if (!args[0] || !args[1]) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Usage: ${message.guild.prefix}tempban <user> <duration> [reason]\n${message.guild.prefix}tempban remove <user>`
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

        const durationArg = args[1].toLowerCase();
        if (!durationArg.endsWith('m') && !durationArg.endsWith('h') && !durationArg.endsWith('d')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} Invalid duration format. Please use:\n• m for minutes (e.g., 30m)\n• h for hours (e.g., 12h)\n• d for days (e.g., 7d)`
                        )
                ]
            });
        }

        const duration = ms(durationArg);
        if (!duration || isNaN(duration)) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please provide a valid duration (e.g., 1d, 12h, 30m)`)
                ]
            });
        }

        const activeAdmins = await Admin.find({ guildId });
        const targetAdminId = user.id;
        const targetAdmin = activeAdmins.find(a => a.adminId === targetAdminId);

        if (targetAdmin && !isSpecialMember) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You cannot ban an admin member in this server. Ask your higher to ban them.`)
                ]
            });
        }

        const hasHigherRole = client.util.hasHigher(message.member);

        if (!isSpecialMember && !admin && !hasHigherRole) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have a role higher than the bot to use this command.`)
                ]
            });
        } else if (admin) {
            const now = new Date();
            const oneDay = 24 * 60 * 60 * 1000;
            if ((now - admin.lastBan) > oneDay) {
                admin.bansToday = 0;
                admin.lastBan = now;
            }

            if (admin.bansToday >= 5) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} You have reached the ban limit for today.`)
                    ]
                });
            }
        }

        const existingTempBans = await client.db.get(`tempBans_${guildId}`) || [];
        const hasExistingBan = existingTempBans.some(b => b.userId === user.id);

        if (hasExistingBan) {
            const existingBan = existingTempBans.find(b => b.userId === user.id);
            const timeLeft = existingBan.expiresAt - Date.now();
            const expiresIn = moment.duration(timeLeft).format('d [days], h [hours], m [minutes]');
            
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} This user is already temporarily banned. The ban will expire in ${expiresIn}.`)
                ]
            });
        }

        let reason = args.slice(2).join(' ') || 'No Reason Provided';
        reason = `${message.author.tag} (${message.author.id}) | Duration: ${durationArg} | ` + reason;

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
                        .setDescription(`${client.emoji.cross} If You Ban Me Then Who Will Protect Your Server Dumb!?`)
                ]
            });
        }

        if (user.id === message.guild.ownerId) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I can't ban the owner of this server.`)
                ]
            });
        }

        let check = message.guild.members.cache.has(user.id);
        if (check === true || user.banable) {
            try {
                const banmess = new MessageEmbed()
                    .setAuthor(
                        message.author.tag,
                        message.author.displayAvatarURL({ dynamic: true })
                    )
                    .setDescription(
                        `You Have Been Temporarily Banned From ${message.guild.name}\nExecutor: ${message.author.tag}\nDuration: ${durationArg}\nReason: \`${reason}\``
                    )
                    .setColor(client.color)
                    .setThumbnail(
                        message.author.displayAvatarURL({ dynamic: true })
                    );

                let member = await message.guild.members.fetch(user.id, true);
                await message.guild.members.ban(member.id, {
                    reason: reason
                });

                const expiresAt = Date.now() + duration;
                existingTempBans.push({
                    userId: user.id,
                    guildId: guildId,
                    reason: reason,
                    expiresAt: expiresAt,
                    bannedById: message.author.id
                });

                await client.db.set(`tempBans_${guildId}`, existingTempBans);
                await member.send({ embeds: [banmess] }).catch((err) => null);

                const durationFormatted = moment.duration(duration).format('d [days], h [hours], m [minutes]');
                const done = new MessageEmbed()
                    .setDescription(
                        `${client.emoji.tick} Successfully banned **<@${user.id}>** from the server for ${durationFormatted}.`
                    )
                    .setColor(client.color);
                message.channel.send({ embeds: [done] });

                if (admin) {
                    admin.bansToday += 1;
                    await admin.save();
                }
            } catch (err) {
                const embed = new MessageEmbed()
                    .setDescription(
                        `${client.emoji.cross} My highest role is below **<@${user.id}>**`
                    )
                    .setColor(client.color);
                return message.channel.send({ embeds: [embed] });
            }
        }

        if (check === false) {
            try {
                const banmess = new MessageEmbed()
                    .setAuthor(
                        message.author.tag,
                        message.author.displayAvatarURL({ dynamic: true })
                    )
                    .setDescription(
                        `You Have Been Temporarily Banned From ${message.guild.name}\nExecutor: ${message.author.tag}\nDuration: ${durationArg}\nReason: \`${reason}\``
                    )
                    .setColor(client.color)
                    .setThumbnail(
                        message.author.displayAvatarURL({ dynamic: true })
                    );

                let member = await client.users.fetch(user.id, true);
                await message.guild.bans.create(member.id, {
                    reason: reason
                });

                const expiresAt = Date.now() + duration;
                existingTempBans.push({
                    userId: user.id,
                    guildId: guildId,
                    reason: reason,
                    expiresAt: expiresAt,
                    bannedById: message.author.id
                });

                await client.db.set(`tempBans_${guildId}`, existingTempBans);

                const durationFormatted = moment.duration(duration).format('d [days], h [hours], m [minutes]');
                const done = new MessageEmbed()
                    .setDescription(
                        `${client.emoji.tick} Successfully banned **<@${user.id}>** from the server for ${durationFormatted}.`
                    )
                    .setColor(client.color);
                message.channel.send({ embeds: [done] });

                if (admin) {
                    admin.bansToday += 1;
                    await admin.save();
                }
            } catch (err) {
                const embed = new MessageEmbed()
                    .setDescription(
                        `${client.emoji.cross} My highest role is below or same as **<@${user.id}>**`
                    )
                    .setColor(client.color);
                return message.channel.send({ embeds: [embed] });
            }
        }
    }
};