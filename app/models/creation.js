const mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

const CreationSchema = new Schema({
    author: {
        type: ObjectId,
        ref: 'User'
    },

    video: {
        type: ObjectId,
        ref: 'Video'
    },

    audio: {
        type: ObjectId,
        ref: 'Audio'
    },

    title: String,

    qiniu_video: String,
    qiniu_thumb: String,

    cloudinary_thumb: String,
    cloudinary_video: String,

    finish: {
        type: Number,
        default: 0
    },

    votes: [String],
    up: {
        type: Number,
        default: 0
    },

    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
});

CreationSchema.pre('save', async function() {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now();
    }
});

module.exports = mongoose.model('Creation', CreationSchema);