const { MessageEmbed } = require('discord.js');
const Admin = require('../../models/admin');

const config = require('../../config.json')

module.exports = {
    name: 'nick',
    aliases: [],
    category: 'mod',
    premium: false,

    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const authorId = message.author.id;
        const isModerator = await client.db.get(`moderators_${guildId}`);
        const isMod = isModerator?.moderators?.includes(authorId);
        const adminId = message.member.id;
        let isSpecialMember = config.boss.includes(message.author.id);

        let admin = await Admin.findOne({ guildId, adminId });

        if (!isSpecialMember && !admin && !isMod) {
            
            if (!message.member.permissions.has('MANAGE_NICKNAMES')) {
                const error = new MessageEmbed()
                    .setColor(client.color)
                    .setDescription('You must have `Manage Nicknames` permission to use this command.');
                return message.channel.send({ embeds: [error] });
            }
        }

        
        if (!message.guild.me.permissions.has('MANAGE_NICKNAMES')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription('I must have `Manage Nicknames` permission to use this command.');
            return message.channel.send({ embeds: [error] });
        }

        let member = await getUserFromMention(message, args[0]);
        let name = args.slice(1).join(" ");
        if (!member) {
            try {
                member = await message.guild.members.fetch(args[0]);
            } catch (error) {
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please provide a valid member.`)]
                });
            }
        }
        if (!isSpecialMember && !admin && !isMod && message.member.roles.highest.position <= member.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You cannot change the nickname of a member with an equal or higher role.`)
                ]
            });
        }

        try {
            if (!name) {
                await member.setNickname(null);
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.tick} ${member}'s nickname has been successfully removed.`)]
                });
            } else {
                await member.setNickname(name);
                return message.channel.send({
                    embeds: [new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.tick} ${member}'s nickname has been successfully changed to ${name}.`)]
                });
            }
        } catch (err) {
            return message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor(client.color)
                    .setDescription(`${client.emoji.cross} I may not have sufficient permissions or my highest role may not be above or the same as member.`)]
            });
        }
    }
};

function getUserFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return null;

    const id = matches[1];
    return message.guild.members.fetch(id).catch(() => null); 
}
