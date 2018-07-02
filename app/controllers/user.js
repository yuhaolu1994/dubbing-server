const mongoose = require('mongoose');
const xss = require('xss');
const User = mongoose.model('User');
const uuidv4 = require('uuid/v4');
const sms = require("../service/sms");

exports.signup = async (ctx, next) => {

    let phoneNumber = xss(ctx.request.body.phoneNumber.trim());

    let user = await User.findOne({
        phoneNumber: phoneNumber
    }).exec();

    let verifyCode = sms.getCode();

    if (!user) {
        let accessToken = uuidv4();

        user = new User({
            nickname: 'Dog name',
            avatar: 'http://dummyimage.com/640x640/4e0968)',
            phoneNumber: xss(phoneNumber),
            verifyCode: verifyCode,
            accessToken: accessToken
        });
    } else {
        user.verifyCode = verifyCode;
    }

    try {
        user = await user.save();
    } catch (e) {
        ctx.body = {
            success: false
        };

        return next;
    }

    let msg = 'your verify code is: ' + user.verifyCode;

    try {
        sms.sendCode(msg);
    } catch (e) {
        console.log(e);
        ctx.body = {
            success: false,
            err: 'message service error'
        };

        return next;
    }

    ctx.body = {
        success: true
    };

};

exports.verify = async (ctx, next) => {
    let verifyCode = ctx.request.body.verifyCode;
    let phoneNumber = ctx.request.body.phoneNumber;

    if (!verifyCode || !phoneNumber) {
        ctx.body = {
            success: false,
            err: 'verify not pass'
        };
        return next;
    }

    let user = await User.findOne({
       phoneNumber: phoneNumber,
       verifyCode: verifyCode
    }).exec();

    if (user) {
        user.verified = true;
        user = await user.save();

        ctx.body = {
            success: true,
            data: {
                nickname: 'nickname_test',
                accessToken: user.accessToken,
                avatar: user.avatar,
                _id: user._id
            }
        }
    } else {
        ctx.body = {
            success: false,
            err: 'verify not pass'
        }
    }


};

exports.update = async (ctx) => {
    let body = ctx.request.body;
    let user = ctx.session.user;
    let fields = 'avatar,gender,age,nickname,breed'.split(',');

    fields.forEach(function (field) {
        if (body[field]) {
            user[field] = xss(body[field].trim());
        }
    });

    user = await user.save();

    ctx.body = {
        success: true,
        data: {
            nickname: user.nickname,
            accessToken: user.accessToken,
            avatar: user.avatar,
            age: user.age,
            breed: user.breed,
            gender: user.gender,
            _id: user._id
        }
    }
};