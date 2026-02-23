const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    guildId: String,
    adminId: String,
    bansToday: { type: Number, default: 0 },
    lastBan: { type: Date, default: Date.now },
    kicksToday: { type: Number, default: 0 },
    lastKick: { type: Date, default: Date.now },
    
});

const admin = mongoose.model('admin', adminSchema);

module.exports = admin;
