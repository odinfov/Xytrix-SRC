const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const Giveaway = require('../../models/giveaway.js');
const { endGiveaway } = require('../../index.js');
const { activeTimeouts } = require('../../index.js');
const config = require('../../config.json')
module.exports = {
    name: 'gend',
    category: 'give',
    aliases: [],
    description: 'Concludes and determines the winner of the giveaway.',
    premium: false,
    async run(client, message, args) {
        let isSpecialMember = config.boss.includes(message.author.id);
        const giveawayData = await Giveaway.findOne({ guildId: message.guild.id });
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('You need admin permissions to end a giveaway.');
        }

        const messageId = args[0];
        if (!messageId) {
            return message.reply('Please provide the message ID of the giveaway to end.');
        }

        try {
            const giveaway = await Giveaway.findOne({ messageId: messageId });
            if (!giveaway) {
                return message.reply('Giveaway not found.');
            }

            const channel = await client.channels.cache.get(giveaway.channelId);
            if (!channel) {
                return message.reply('Channel not found.');
            }

            const giveawayMessage = await channel.messages.fetch(giveaway.messageId);
            if (!giveawayMessage) {
                return message.reply('Giveaway message not found.');
            }

            await endGiveaway(client, giveaway, activeTimeouts);
            await Giveaway.findOneAndDelete({ messageId: messageId });

        } catch (error) {
            console.error('Error ending giveaway:', error);
            message.reply('An error occurred while ending the giveaway.');
        }
    }
};
