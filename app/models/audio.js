const mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;
let Mixed = Schema.Types.Mixed;

const AudioSchema = new Schema({
    author: {
        type: ObjectId,
        ref: 'User'
    },

    video: {
        type: ObjectId,
        ref: 'Video'
    },

    public_id: String,
    detail: Mixed,

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

AudioSchema.pre('save', async function() {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now();
    }
});

module.exports = mongoose.model('Audio', AudioSchema);