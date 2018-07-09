const mongoose = require('mongoose');

let Creation = mongoose.model('Creation');
let Comment = mongoose.model('Comment');

let userFields = [
    'avatar',
    'nickname',
    'gender',
    'age',
    'breed'
];

exports.find = async (ctx, next) => {
    let feed = ctx.query.feed;
    let cid = ctx.query.cid;
    let id = ctx.query.id;
    let count = 5;
    let query = {
        creation: cid
    };

    if (!cid) {
        ctx.body = {
            success: false,
            err: 'id should not be null'
        };

        return next;
    }

    if (id) {
        if (feed === 'recent') {
            query._id = {'$gt': id}
        } else {
            query._id = {'$lt': id}
        }
    }

    let data = await Comment.find(query)
        .populate('replyBy', userFields.join(' '))
        .sort({
            'meta.createAt': -1
        })
        .limit(count)
        .exec();

    let total = await Comment.count({creation: cid}).exec();

    ctx.body = {
        success: true,
        data: data,
        total: total
    }

};

exports.save = async (ctx, next) => {
    let commentData = ctx.request.body.comment;
    let user = ctx.session.user;
    let creation = await Creation.findOne({
        _id: commentData.creation
    }).exec();

    if (!creation) {
        ctx.body = {
            success: false,
            err: 'no video'
        };

        return next;
    }

    let comment;

    if (commentData.cid) {
        comment = await Comment.findOne({
            _id: commentData.cid
        }).exec();

        let reply = {
            from: commentData.from,
            to: commentData.tid,
            content: commentData.content
        };

        comment.reply.push(reply);

        await comment.save();
    } else {
        comment = new Comment({
            creation: creation._id,
            replyBy: user._id,
            replyTo: creation.author,
            content: commentData.content
        });

        await comment.save();
    }

    let data = await Comment.find({
        creation: creation._id
    })
        .populate('replyBy', userFields.join(' '))
        .sort({
            'meta.createAt': -1
        })
        .exec();

    let total = await Comment.count({creation: creation._id}).exec();

    ctx.body = {
        success: true,
        data: data,
        total: total
    }
};