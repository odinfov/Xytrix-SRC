const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    inviterId: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true },
    uses: { type: Number, default: 0 },
    joins: { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    rejoins: { type: Number, default: 0 },
    members: { type: [String], default: [] },
    leavedMembers: { type: [String], default: [] },
    deletedTimestamp: { type: Date, default: null },
}, { timestamps: true });

module.exports = inviteSchema;
