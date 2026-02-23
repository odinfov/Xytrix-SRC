const { MessageEmbed } = require('discord.js');
const Autoresponder = require('../models/autoreactor'); 
const cooldowns = new Map(); 

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        
        const messageContent = message.content.toLowerCase();
        const autoreactors = await Autoresponder.find({ guildId: message.guild.id });
        
        for (const autoreactor of autoreactors) {
            const { keyword, reaction, mode = 'include' } = autoreactor;
            
            if (mode === 'exact') {
                if (messageContent === keyword.toLowerCase()) {
                    handleReaction(keyword, reaction, message);
                }
            } else {
                if (messageContent.includes(keyword.toLowerCase())) {
                    handleReaction(keyword, reaction, message);
                }
            }
        }
    });
};

async function handleReaction(keyword, reaction, message) {
    const now = Date.now();
    const cooldownTime = 3000; 
   
    if (cooldowns.has(keyword)) {
        const expirationTime = cooldowns.get(keyword);
        if (now < expirationTime) {
            return;
        }
    }
    
    cooldowns.set(keyword, now + cooldownTime);
    try {
        await message.react(reaction);
    } catch (err) {
        if (err.code === 429) {
            if (typeof client !== 'undefined' && client.util && client.util.handleRateLimit) {
                await client.util.handleRateLimit();
            }
            return;
        } else {
            console.error('Failed to react to the message:', err);
        }
    }
}
