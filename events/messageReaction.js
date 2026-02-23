const { MessageEmbed } = require('discord.js');
const ReactionRole = require('../models/reaction'); 

module.exports = async (client) => {
    client.once('ready', async () => {
        console.log(`Logged in as ${client.user.tag}!`);
        await loadReactionRoles();
    });

    const loadReactionRoles = async () => {
        try {
            console.log('Loading reaction roles from the database...');
            const reactionRoles = await ReactionRole.find();

            if (!reactionRoles.length) {
                console.log('No reaction roles found in the database.');
                return;
            }

            for (const reactionRole of reactionRoles) {
                const { guildId, messageId, roles, channelId } = reactionRole;


                if (!guildId || !channelId || !messageId) {
                    console.error('Missing guildId, channelId, or messageId in database entry.');
                    continue;
                }

                
                let guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    console.log(`Guild ${guildId} not found in cache, attempting to fetch...`);
                    try {
                        guild = await client.guilds.fetch(guildId);
                    } catch (err) {
                        console.error(`Could not fetch guild ${guildId}: ${err.message}`);
                        continue;
                    }
                }

                
                let channel;
                try {
                    channel = await guild.channels.fetch(channelId);
                } catch (err) {
                    console.error(`Could not fetch channel ${channelId} in guild ${guildId}: ${err.message}`);
                    continue;
                }
                if (!channel) {
                    console.log(`Channel ${channelId} not found in guild ${guildId}.`);
                    continue;
                }

                
                let message;
                try {
                    message = await channel.messages.fetch(messageId);
                } catch (err) {
                    console.error(`Could not fetch message ${messageId} in channel ${channelId}: ${err.message}`);
                    continue;
                }
                if (!message) {
                    console.log(`Message ${messageId} not found in channel ${channelId}.`);
                    continue;
                }

                
                for (const roleData of roles) {
                    try {
                        await message.react(roleData.emoji);
                    } catch (err) {
                        console.error(`Could not react with ${roleData.emoji} on message ${messageId}: ${err.message}`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error loading reaction roles: ${error.message}`);
        }
    };
};
