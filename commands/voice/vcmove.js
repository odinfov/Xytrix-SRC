const {
    Message,
    Client,
    MessageEmbed
} = require('discord.js');
const config = require('../../config.json')
const Admin = require('../../models/admin');

module.exports = {
    name: 'vcmove',
    category: 'voice',
    aliases: ['move', 'pull'],
    description: `Moves a user from one voice channel to another.`,
    premium: false,
    run: async (client, message, args) => {
        const guildId = message.guild.id;
        const adminId = message.member.id;
        let isSpecialMember = config.boss.includes(message.author.id);
        let admin = await Admin.findOne({ guildId, adminId });

        if (!isSpecialMember && !admin && !message.member.permissions.has('MOVE_MEMBERS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`You must have \`Move Members\` permission to use this command.`);
            return message.channel.send({ embeds: [error] });
        }

        if (!message.guild.me.permissions.has('MOVE_MEMBERS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`I must have \`Move Members\` permission to use this command.`);
            return message.channel.send({ embeds: [error] });
        }

        const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

        if (!user) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`Please mention a user or provide their ID.`)
                ]
            });
        }

        if (!user.voice.channel) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`${user} is not connected to any voice channel.`)
                ]
            });
        }

        
        if (!targetChannel) {
            if (!message.member.voice.channel) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`You must be in a voice channel or provide a target channel to move the user.`)
                    ]
                });
            }
            
            if (!isSpecialMember && !admin && !message.member.permissionsIn(message.member.voice.channel).has('CONNECT')) {
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`You don't have permission to connect to the voice channel you cannot move users.`)
                    ]
                });
            }

            try {
                await user.voice.setChannel(message.member.voice.channel);
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`Successfully dragged ${user} into your voice channel.`)
                    ]
                });
            } catch (error) {
                console.error(error);
                return message.channel.send({
                    embeds: [
                        new MessageEmbed()
                            .setColor(client.color)
                            .setDescription(`An error occurred while moving the user. Please try again.`)
                    ]
                });
            }
        }

        
        if (targetChannel.type !== 'GUILD_VOICE') {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`Please provide a valid voice channel mention or ID.`)
                ]
            });
        }
        
        if (!isSpecialMember && !admin && !message.member.permissionsIn(targetChannel).has('CONNECT')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`You don't have permission to connect to ${targetChannel} you cannot move users.`)
                ]
            });
        }

        try {
            await user.voice.setChannel(targetChannel);
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`Successfully moved ${user} to ${targetChannel}.`)
                ]
            });
        } catch (error) {
            console.error(error);
            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(`An error occurred while moving the user. Please try again.`)
                ]
            });
        }
    }
};
