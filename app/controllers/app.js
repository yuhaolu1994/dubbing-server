const mongoose = require('mongoose');
const robot = require('../service/robot');

let User = mongoose.model('User');

exports.signature = async (ctx) => {
    let body = ctx.request.body;
    let cloud = body.cloud;
    let data;

    if (cloud === 'qiniu') {
        data = robot.getQiniuToken(body);
    } else {
        data = robot.getCloudinaryToken(body);
    }

    ctx.body = {
        success: true,
        data: data
    }
};

exports.hasBody = async (ctx, next) => {
    let body = ctx.request.body || {};

    if (Object.keys(body).length === 0) {
        ctx.body = {
            success: false,
            err: 'lose something'
        };

        return next;
    }

    await next();
};

exports.hasToken = async (ctx, next) => {
    let accessToken = ctx.query.accessToken;

    if (!accessToken) {
        accessToken = ctx.request.body.accessToken;
    }

    if (!accessToken) {
        ctx.body = {
            success: false,
            err: 'no token'
        };

        return next;
    }

    let user = await User.findOne({
        accessToken: accessToken
    }).exec();

    if (!user) {
        ctx.body = {
            success: false,
            err: 'no login'
        };

        return next;
    }

    ctx.session = ctx.session || {};
    ctx.session.user = user;

    await next();
};