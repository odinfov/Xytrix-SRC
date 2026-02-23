const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const Giveaway = require('../../models/giveaway.js'); 
const config = require('../../config.json')
module.exports = {
    name: 'greroll',
    category: 'give',
    description: 'Selects a new winner for the giveaway.',
    aliases: [],
    premium: false,
    async run(client, message, args) {
        let isSpecialMember = config.boss.includes(message.author.id);
        const giveawayData = await Giveaway.findOne({ guildId: message.guild.id });
        if (!isSpecialMember && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} You must have \`Administration\` perms to run this command.`
                        )
                ]
            });
        }

        
        const messageId = args[0]; 
        if (!messageId) {
            return message.reply('Please provide the message ID of the giveaway to reroll winners.');
        }

        try {
            
            const giveaway = await Giveaway.findOne({ messageId: messageId });
            if (!giveaway) {
                return message.reply('Giveaway not found.');
            }

            const currentTime = new Date();
            if (currentTime < giveaway.endsAt) {
                return message.reply('The giveaway has not ended yet.');
            }

            const channel = await client.channels.cache.get(giveaway.channelId);
            if (!channel) {
                return message.reply('Channel not found.');
            }

            
            const giveawayMessage = await channel.messages.fetch(giveaway.messageId);
            if (!giveawayMessage) {
                return message.reply('Giveaway not found. Make sure you\'re using the correct message ID.');
            }

            
            await endGiveaway(client, giveaway, giveawayMessage);

        } catch (error) {
            console.error('Error rerolling giveaway:', error);
            message.reply('An error occurred while rerolling the giveaway.');
        }
    }
};

async function endGiveaway(client, giveaway, activeTimeouts) {
    const channel = await client.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    try {
        const message = await channel.messages.fetch(giveaway.messageId);
        if (!message) return;

        const reactions = message.reactions.cache.get(giveaway.emoji);
        if (!reactions) return;

        const users = await reactions.users.fetch();
        const filtered = users.filter(user => !user.bot);

        let winners = []; 

        if (filtered.size > 0) {
            for (let i = 0; i < giveaway.numWinners; i++) {
                const winner = filtered.random();
                winners.push(winner);
                filtered.delete(winner.id); 
            }

            const congratulationsMessage = `Congrats, ${winners.map(user => user.toString()).join(', ')} You won **${giveaway.prize}**, hosted by <@${giveaway.hostId}>`;

            const giveawayLinkButton = new MessageButton()
                .setLabel('View Giveaway')
                .setStyle('LINK')
                .setURL(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`);

            
            const actionRow = new MessageActionRow()
                .addComponents(giveawayLinkButton);

            
            await channel.send({ content: congratulationsMessage, components: [actionRow] });
        } else {
            await channel.send('No entries detected therefore cannot declare the winner.');
        }

        const endEmbed = new MessageEmbed(message.embeds[0])
            .setTitle(`<a:Xytrix_giveawaybox:1431977464053370901> **${giveaway.prize}** <a:Xytrix_giveawaybox:1431977464053370901>`)
            .setDescription(`<a:Xytrix_dot:1431281000901644318> Ended: <t:${Math.floor(Date.now() / 1000)}:R>\n<a:Xytrix_dot:1431281000901644318> Hosted by: <@${giveaway.hostId}>\n\n<a:Xytrix_dot:1431281000901644318> **Winners:**\n${winners.length > 0 ? winners.map(user => user.toString()).join(', ') : 'No entries detected therefore cannot declare the winner.'}`)
            .setFooter('Ended');
        await message.edit({ content: '<:Xytrix_gwy:1430993235064524912> **Giveaway Ended** <:Xytrix_gwy:1430993235064524912>', embeds: [endEmbed] });

        if (activeTimeouts[giveaway.messageId]) {
            clearTimeout(activeTimeouts[giveaway.messageId]);
            delete activeTimeouts[giveaway.messageId];
        }
    } catch (error) {
        console.error('Error ending giveaway:', error);
    }
}
