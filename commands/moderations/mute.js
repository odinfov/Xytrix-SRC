const { MessageEmbed } = require('discord.js');
const ms = require('ms');
const Admin = require('../../models/admin');
const config = require('../../config.json')

module.exports = {
    name: 'mute',
    aliases: ['timeout', 'stfu'],
    category: 'mod',
    description: 'Mute the member for a specified duration',
    premium: false,

    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const authorId = message.author.id;

        const isModerator = await client.db.get(`moderators_${guildId}`);
        const isMod = isModerator?.moderators?.includes(authorId);
        

        const adminId = message.member.id;
        let admin = await Admin.findOne({ guildId, adminId });
        
        let isSpecialMember = config.boss.includes(message.author.id);

        if (!isSpecialMember && !admin && !isMod && !message.member.permissions.has('MODERATE_MEMBERS')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have \`Timeout Members\` permissions to use this command.`)
                ]
            });
        }

        if (!message.guild.me.permissions.has('MODERATE_MEMBERS')) {
            return message.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I must have \`Timeout Members\` permissions to run this command.`)
                ]
            });
        }

        let user = await getUserFromMention(message, args[0]);
        if (!user) {
            return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} You didn't mentioned the member whom you want to mute.`)
                    ]
                });
            }
        
        let reason = args.slice(2).join(' ');
        if (!reason) reason = 'No Reason given';

        let time = args[1];
        if (!time) time = '27d'; 

        let dur = ms(time);
        if (!dur) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You didn't specify a valid time.\n${message.guild.prefix}mute \`<member>\` \`<time>\` \`<reason>\``)
                ]
            });
        }

        if (user.isCommunicationDisabled()) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} <@${user.user.id}> is already muted!`)
                ]
            });
        }

        if (user.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} <@${user.user.id}> has \`Administrator\` permissions!`)
                ]
            });
        }

        if (user.id === client.user.id) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You can't mute me.`)
                ]
            });
        }

        if (user.id === message.guild.ownerId) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You can't mute the server owner!`)
                ]
            });
        }

        if (user.id === message.member.id) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You can't mute yourself.`)
                ]
            });
        }

        if (!user.manageable) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I don't have enough permissions to mute <@${user.user.id}>.`)
                ]
            });
        }


        const targetIsModerator = activeModerators.includes(user.id);

        const targetIsAdmin = activeAdmins.some(a => a.adminId === user.id);
        
        if (targetIsModerator && isMod && !isSpecialMember) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You cannot mute other moderators !`)
                ]
            });
        }

        if (targetIsAdmin && admin && !isSpecialMember) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You cannot mute other admins !`)
                ]
            });
        }

        // const executorHighestRole = message.member.roles.highest.position;
        // const targetHighestRole = user.roles.highest.position;
        
        // if (!isSpecialMember && executorHighestRole <= targetHighestRole) {
        //     return message.channel.send({
        //         embeds: [
        //             new MessageEmbed()
        //                 .setColor(client.color)
        //                 .setDescription(`${client.emoji.cross} You cannot mute someone with the same or higher role than yourself!`)
        //         ]
        //     });
        // }
        
        const muteEmbed = new MessageEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(`You have been muted in ${message.guild.name} \nExecutor: ${message.author.tag} \nReason: \`${reason}\``)
            .setColor(client.color)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

        await user.timeout(dur, `${message.author.tag} | ${reason}`).then(() => {
            user.send({ embeds: [muteEmbed] }).catch(() => null);
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.tick} Successfully muted <@${user.user.id}>!`)
                ]
            });
        }).catch(err => {
            console.error(err);
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} An error occurred while muting <@${user.user.id}>.`)
                ]
            });
        });
    }
};

function getUserFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return null;

    const id = matches[1];
    return message.guild.members.fetch(id).catch(() => null);
}
