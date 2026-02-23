const { Message, Client, MessageEmbed } = require('discord.js');
const Admin = require('../../models/admin');
const config = require('../../config.json')

module.exports = {
    name: 'chatunban',
    aliases: ['cunban', 'unmutechat'],
    category: 'mod',
    description: 'Unbans the specified user from sending messages in the channel.',
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

        if (!isSpecialMember && !admin && !message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Manage Channels\` permissions to use this command.`
                        )
                ]
            });
        }

        let user;
        try {
            user = await getUserFromMention(message, args[0]) || await client.users.fetch(args[0]);
        } catch (err) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} Please provide a valid user ID or mention.`)
                ]
            });
        }

        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} The user is not in this server.`)
                ]
            });
        }

        const overwrite = message.channel.permissionOverwrites.cache.get(member.id);
        if (!overwrite) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} This user is not banned from sending messages in this channel.`)
                ]
            });
        }

        try {
            await message.channel.permissionOverwrites.delete(member.id);

            const successEmbed = new MessageEmbed()
                .setDescription(
                    `${client.emoji.tick} Successfully unbanned **<@${member.id}>** from sending messages in this channel.`
                )
                .setColor(client.color);
            message.channel.send({ embeds: [successEmbed] });
        } catch (err) {
            console.error(err);
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} I couldn't unban the user from this channel.`)
                ]
            });
        }
    }
};

async function getUserFromMention(message, mention) {
    if (!mention) return null;

    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return null;

    const id = matches[1];
    return await message.client.users.fetch(id);
}
