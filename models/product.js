const mongoose = require("mongoose");

const producerSchema = require('./producer')

const Schema = mongoose.Schema;

const productSchema = new Schema({
    vintage: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    producerId: {
        type: Schema.Types.ObjectId,
        ref: 'Producer'
    },
    producer: producerSchema
});

module.exports = mongoose.model('Product', productSchema)


