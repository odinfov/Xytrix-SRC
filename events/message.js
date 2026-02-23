const mongoose = require('mongoose');
const BlacklistChannel = require('../models/blacklistchannel');

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        try {
            const User = client.secondDb.model('User', require('../models/user'));
            const isBlacklisted = await BlacklistChannel.findOne({ 
                guildId: message.guild.id, 
                channelId: message.channel.id 
            });

            if (isBlacklisted) return;

            let userRecord = await User.findOne({ guild: message.guild.id, user: message.author.id });
            
            const now = new Date();

            if (!userRecord) {
                userRecord = new User({
                    user: message.author.id,
                    guild: message.guild.id,
                    messages: 1,
                    dailyMessages: 1,
                    lastMessageDate: now
                });
            } else {
                const lastMessageDate = new Date(userRecord.lastMessageDate);
                const hoursDifference = (now - lastMessageDate) / (1000 * 60 * 60); 

                if (hoursDifference >= 24) {
                    userRecord.dailyMessages = 1;
                } else {
                    userRecord.dailyMessages++;
                }
                userRecord.messages++;
                userRecord.lastMessageDate = now;
            }

            await userRecord.save();
        } catch (err) {
            console.error(`Error in messageCreate event: ${err.stack}`);
        }
    });
};