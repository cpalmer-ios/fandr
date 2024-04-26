const mongoose = require("mongoose");

const producerSchema = new mongoose.Schema({
    name: String,
    country: String,
    region: String
})

module.exports = mongoose.model('Producer', producerSchema)