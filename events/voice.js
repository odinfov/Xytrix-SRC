module.exports = async (client) => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.member.user.bot) return;
        
        try {
            const User = client.secondDb.model('User', require('../models/user'));
            
            let userRecord = await User.findOne({ 
                guild: newState.guild.id, 
                user: newState.member.user.id 
            });

            const now = new Date();

            if (!userRecord) {
                userRecord = new User({
                    user: newState.member.user.id,
                    guild: newState.guild.id,
                    lastVoiceDate: now,
                    voiceTime: 0,
                    dailyVoiceTime: 0,
                    isInVoice: false
                });
            }
            if (!oldState.channelId && newState.channelId) {
                userRecord.isInVoice = true;
                userRecord.voiceJoinTimestamp = now;
            }
            else if (oldState.channelId && !newState.channelId) {
                if (userRecord.isInVoice && userRecord.voiceJoinTimestamp) {
                    const timeSpent = Math.floor((now - new Date(userRecord.voiceJoinTimestamp)) / 1000); 
                    
                    const lastVoiceDate = new Date(userRecord.lastVoiceDate);
                    if (
                        now.getDate() !== lastVoiceDate.getDate() ||
                        now.getMonth() !== lastVoiceDate.getMonth() ||
                        now.getFullYear() !== lastVoiceDate.getFullYear()
                    ) {
                        userRecord.dailyVoiceTime = timeSpent;
                    } else {
                        userRecord.dailyVoiceTime = (userRecord.dailyVoiceTime || 0) + timeSpent;
                    }
                    
                    userRecord.voiceTime = (userRecord.voiceTime || 0) + timeSpent;
                    userRecord.isInVoice = false;
                    userRecord.lastVoiceDate = now;
                    userRecord.voiceJoinTimestamp = null;
                }
            }

            await userRecord.save();

        } catch (err) {
            console.error(`Error in voiceStateUpdate event:`, err);
        }
    });
};
