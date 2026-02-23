const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu
} = require('discord.js');
const config = require('../../config.json')
module.exports = {
    name: 'unlockall',
    category: 'mod',
    aliases: [],
    description: `Unlock's all the channels of the server`,
    premium: true,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_CHANNELS')) {
            let error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `You must have \`Manage Channels\` permission to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }
        if (!isSpecialMember && client.util.hasHigher(message.member) == false) {
            let error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `Your highest role must be higher than my highest role to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }

        let unlocked = 0;
        const channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]) ||
            message.channel;

        try {
            for (const channel of message.guild.channels.cache.filter((c) => c.name).values()) {
                if (channel.manageable) {
                    try {
                        await channel.permissionOverwrites.edit(message.guild.id, {
                            SEND_MESSAGES: true,
                            reason: `UNLOCKALL BY ${message.author.tag} (${message.author.id})`
                        });
                        unlocked++;
                    } catch (error) {
                        if (error.code === 429) {
                            await client.util.handleRateLimit();
                        } else {
                            throw error;
                        }
                    }
                }
            }

            message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.tick} Successfully **unlocked** ${unlocked} channels from this server.`
                        )
                ]
            });
        } catch (error) {
            if (error.code === 429) {
                await client.util.handleRateLimit();
            }
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription('An error occurred while unlocking channels.')
                ]
            });
        }
    }
};
