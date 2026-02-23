const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    messageId: String,
    channelId: String,
    prize: String,
    emoji: String,
    endsAt: Date,
    guildId: String,
    numWinners: Number,
    hostId: String,
    roleId: String,
});

module.exports = mongoose.model('Giveaway', giveawaySchema);
