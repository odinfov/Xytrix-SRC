const { Message, Client, MessageEmbed } = require('discord.js');
const config = require('../../config.json')

module.exports = {
    name: 'slowmode',
    aliases: [],
    category: 'mod',
    description: `Sets slow mode in the channel. Use 0 to turn it off.`,
    premium: false,

    run: async (client, message, args) => {
        let isSpecialMember = config.boss.includes(message.author.id);
        if (!isSpecialMember && !message.member.permissions.has('MANAGE_CHANNELS')) {
            const error = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `You must have \`Manage Channels\` permission to use this command.`
                );
            return message.channel.send({ embeds: [error] });
        }

        const time = parseInt(args[0]);

        if (isNaN(time) || time < 0 || time > 21600) {
            const invalidTime = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    `Please provide a valid time interval (in seconds) between 0 and 21600. Use 0 to turn off slowmode.`
                );
            return message.channel.send({ embeds: [invalidTime] });
        }

        try {
            await message.channel.setRateLimitPerUser(time);
            
            const successEmbed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(
                    time === 0 
                        ? `${client.emoji.tick} Successfully Slow mode has been turned off.`
                        : `${client.emoji.tick} Successfully Slow mode has been set to ${time} seconds.`
                );
            return message.channel.send({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error occurred while setting slow mode:', error);
            const errorEmbed = new MessageEmbed()
                .setColor(client.color)
                .setDescription(`An error occurred while setting slow mode.`);
            return message.channel.send({ embeds: [errorEmbed] });
        }
    }
};
