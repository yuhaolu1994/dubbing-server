const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    phoneNumber: {
        unique: true,
        type: String
    },
    areaCode: String,
    verifyCode: String,
    verified: {
        type: Boolean,
        default: false
    },
    accessToken: String,
    nickname: String,
    gender: String,
    breed: String,
    age: String,
    avatar: String,
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

UserSchema.pre('save', async function() {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
        this.meta.updateAt = Date.now();
    }
});

module.exports = mongoose.model('User', UserSchema);