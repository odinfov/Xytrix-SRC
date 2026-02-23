const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user: { type: String, required: true },
    guild: { type: String, required: true },
    messages: { type: Number, default: 0 },
    dailyMessages: { type: Number, default: 0 },
    lastMessageDate: { type: Date, default: Date.now },

    voiceTime: { type: Number, default: 0 }, 
    dailyVoiceTime: { type: Number, default: 0 }, 
    lastVoiceDate: { type: Date }, 
    isInVoice: { type: Boolean, default: false }, 
    voiceJoinTimestamp: { type: Date }
});

module.exports = userSchema;
