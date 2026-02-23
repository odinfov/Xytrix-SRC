const { MessageEmbed } = require('discord.js');
const Autoresponder = require('../models/autoresponder');
const cooldowns = new Map();

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        try {
            if (message.author.bot) return;
            if (!message.guild) return;

            const messageContent = message.content.toLowerCase().trim();

            const autoresponders = await Autoresponder.find({ guildId: message.guild.id });

            for (const autoresponder of autoresponders) {
                const { keyword, response, exact } = autoresponder;
                
                const isMatch = exact 
                    ? messageContent === keyword 
                    : messageContent.includes(keyword);

                if (isMatch) {
                    const now = Date.now();
                    const cooldownTime = 3000;
                    
                    if (cooldowns.has(keyword)) {
                        const expirationTime = cooldowns.get(keyword);
                        if (now < expirationTime) {
                            return;
                        }
                    }
                    
                    cooldowns.set(keyword, now + cooldownTime);
                    
                    const processedResponse = response.replace(/{user}/g, `<@${message.author.id}>`);
                    
                    await message.channel.send({
                        content: processedResponse,
                        allowedMentions: { 
                            users: [message.author.id]
                        }
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Error in autoresponder:', error);
        }
    });
};
