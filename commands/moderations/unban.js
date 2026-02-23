const { Message, Client, MessageEmbed } = require('discord.js');
const Admin = require('../../models/admin');
const config = require('../../config.json')
module.exports = {
    name: 'unban',
    category: 'mod',
    aliases: [],
    description: `Removes the ban on the specified user in the server.`,
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

        let admin = await Admin.findOne({ guildId, adminId });
        let isSpecialMember = config.boss.includes(message.author.id);
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
                            `${client.emoji.cross} I must have \`Ban Members\` permissions to execute this command.`
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
        }

        const ID = args[0];
        if (!ID) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You didn't provide the ID of the member to unban.`
                        )
                ]
            });
        } else {
            try {
                const user = await message.guild.bans.fetch(ID);
                if (!user) {
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.cross} This user isn't banned in this server.`
                                )
                        ]
                    });
                } else {
                    await message.guild.members.unban(ID);
                    return message.channel.send({
                        embeds: [
                            new MessageEmbed()
                                .setColor(client.color)
                                .setDescription(
                                    `${client.emoji.tick} Successfully unbanned the member.`
                                )
                        ]
                    });
                }
            } catch (err) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} I was unable to unban that member.`
                            )
                    ]
                });
            }
        }
    }
};
