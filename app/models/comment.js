const mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

const CommentSchema = new Schema({
    creation: {
        type: ObjectId,
        ref: 'Creation'
    },

    content: String,

    replyBy: {
        type: ObjectId,
        ref: 'User'
    },

    replyTo: {
        type: ObjectId,
        ref: 'User'
    },

    reply: [{
        from: {
            type: ObjectId,
            ref: 'User'
        },
        to: {
            type: ObjectId,
            ref: 'User'
        },
        content: String
    }],

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

CommentSchema.pre('save', async function () {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now();
    }
});

module.exports = mongoose.model('Comment', CommentSchema);