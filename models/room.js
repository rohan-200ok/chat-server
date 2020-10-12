const mongoose = require('mongoose');

const room = new mongoose.Schema({
    orderId: String,
    productId: String,
    order: Object,
    product: Object,
    sellerId: String,
    sellerName: String,
    buyerId: String,
    buyerName: String
})

module.exports = mongoose.model('roomContent',room)
