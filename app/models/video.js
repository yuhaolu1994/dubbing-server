const mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;
let Mixed = Schema.Types.Mixed;

const VideoSchema = new Schema({
    author: {
        type: ObjectId,
        ref: 'User'
    },

    qiniu_key: String,
    persistentId: String,
    qiniu_final_key: String,
    qiniu_detail: Mixed,

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

VideoSchema.pre('save', async function() {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now();
    }
});

module.exports = mongoose.model('Video', VideoSchema);