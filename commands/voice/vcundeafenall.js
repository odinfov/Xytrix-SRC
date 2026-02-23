const { MessageEmbed } = require('discord.js');
const config = require('../../config.json')
const Admin = require('../../models/admin');
module.exports = {
    name: 'vcundeafenall',
    category: 'voice',
    aliases: [],
    description: `Undeafen all the users in the voice channel.`,
    premium: false,
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let admin = await Admin.findOne({ guildId, adminId }); 
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!admin && !isSpecialMember && !message.member.permissions.has('DEAFEN_MEMBERS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `You must have \`Deafen members\` permission to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }
        if (!message.guild.me.permissions.has('DEAFEN_MEMBERS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `I must have \`Deafen members\` permission to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }
        if (!message.member.voice.channel) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `You must be connected to a voice channel first.`
                        )
                ]
            });
        }
        let own = message.author.id == message.guild.ownerId;
        if (!admin && !isSpecialMember && !own && message.guild.me.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} You must have a higher role than me to use this command.`)
                ]
            });
        }
        try {
            let i = 0;
            message.member.voice.channel.members.forEach(async (member) => {
                i++;
                await member.voice.setDeaf(false,`${message.author.tag} | ${message.author.id}`);
                await client.util.sleep(1000); 
            });
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully Undeafened ${i} Members in ${message.member.voice.channel}!`
                        )
                ]
            });
        } catch (err) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `I don't have the required permissions to undeafen members.`
                        )
                ]
            });
        }
    }
};
