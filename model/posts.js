const mongoose = require('mongoose');
const { Schema, SchemaTypes, model } = mongoose;

const postSchema = new Schema({
    authorId: {
        type: SchemaTypes.ObjectId,
        ref: 'User',
    },
    authorUsername: String,
    createdAt: {
        type: Date,
        default: ()=> Date.now(),
        immutable: true,
    },
    title: String,
    content: String,
    image: String,
    tags: [String],
    likes: [{
        userId: {
            type: SchemaTypes.ObjectId,
            ref: 'User',            
        },
        appUsername: String,
    }],
    comments: [{
        userId: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
        appUsername: String,
        content: String,
        likes: Number,
    }]
    
});

const Post = model('Post', postSchema);
module.exports = Post;