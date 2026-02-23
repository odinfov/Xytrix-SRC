const mongoose = require('mongoose');

const blacklistChannelSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true }
});

module.exports = mongoose.model('BlacklistChannel', blacklistChannelSchema);
