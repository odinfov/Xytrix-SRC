const mongoose = require('mongoose');

const AutoreactorSchema = new mongoose.Schema({
    guildId: String,
    keyword: String,
    reaction: String,
    mode: { type: String, default: 'include' }
});

const Autoreactor = mongoose.model('Autoreactor', AutoreactorSchema);

module.exports = Autoreactor;
