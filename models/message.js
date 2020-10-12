const mongoose = require('mongoose');

const message = new mongoose.Schema({
    roomId: String,
    text: String,
    createdAt: { type: Date, default: Date.now },
    user: Object
})

module.exports = mongoose.model('messageContent',message)
