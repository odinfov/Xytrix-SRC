const { MessageEmbed } = require('discord.js');
const StickyMessage = require('../models/sticky');

module.exports = async (client) => {
    const messageCounts = new Map();
    
    client.on('messageCreate', async (message) => {
        if (!message.guild) return;
        
        const channelId = message.channel.id;
        const guildId = message.guild.id;
        
        try {
            const isPremium = await client.db.get(`sprem_${guildId}`);
            const channelLimit = isPremium ? 5 : 2;
            
            const allStickyMessages = await StickyMessage.find({ guildId });
            
            const validChannels = allStickyMessages
                .slice(0, channelLimit)
                .map(sticky => sticky.channelId);
                
            if (!validChannels.includes(channelId)) return;
            
            const sticky = await StickyMessage.findOne({ guildId, channelId });
            if (!sticky) return;
            
            if (!isPremium && sticky.isEmbed) {
                return;
            }
            
            const currentCount = messageCounts.get(channelId) || 0;
            messageCounts.set(channelId, currentCount + 1);
            
            const messageLimit = sticky.limit || 5;
            
            if (messageCounts.get(channelId) >= messageLimit) {
                messageCounts.set(channelId, 0);
                
                try {
                    if (sticky.messageId) {
                        try {
                            const oldMessage = await message.channel.messages.fetch(sticky.messageId);
                            if (oldMessage) {
                                await oldMessage.delete();
                            }
                        } catch (error) {
                            console.error('Error deleting old sticky message:', error);
                        }
                    }
                    
                    const prefix = '**__Stickied Message:__**\n\n';
                    
                    if (sticky.isEmbed && isPremium && sticky.embed) {
                        const embed = new MessageEmbed(sticky.embed);
                        const sentMessage = await message.channel.send({
                            embeds: [embed],
                            allowedMentions: { parse: [] }, 
                            content: prefix
                        });
                        
                        sticky.messageId = sentMessage.id;
                        await sticky.save();
                    } else if (!sticky.isEmbed) {
                        const content = prefix + sticky.content;
                        const sentMessage = await message.channel.send({
                            content,
                            allowedMentions: { parse: [] }
                        });
                        
                        sticky.messageId = sentMessage.id;
                        await sticky.save();
                    }
                } catch (error) {
                    console.error('Error reposting sticky message:', error);
                }
            }
        } catch (error) {
            console.error('Error in sticky message handling:', error);
        }
    });
};