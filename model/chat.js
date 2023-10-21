const mongoose = require('mongoose');
const { Schema, SchemaTypes, model } = mongoose;

const chatSchema = new Schema({
    type: String,
    users: [{
        userName: String,
        userId: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
    }],
    messages: [{
        authorName: String,
        authorId: {
            type: SchemaTypes.ObjectId,
            ref: 'User'
        },
        text: String,
        sentAt: {
            type: Date,
            default: ()=> Date.now(),
            immutable: true,
        }
    }],
    

});

const Chat = model('Chat', chatSchema);
module.exports = Chat;