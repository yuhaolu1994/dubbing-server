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
    let id = ctx.query.creation;

    if (!id) {
        ctx.body = {
            success: false,
            err: 'id should not be null'
        };

        return next;
    }

    // let queryArray = [
    //     Comment.find({
    //         creation: id
    //     })
    //         .populate('replyBy', userFields.join(' '))
    //         .sort({
    //             'meta.createAt': -1
    //         })
    //         .exec(),
    //     Comment.count({finish: 100}).exec()
    // ];

    // let data = await queryArray;

    let data = await Comment.find({
        creation: id
    })
        .populate('replyBy', userFields.join(' '))
        .sort({
            'meta.createAt': -1
        })
        .exec();

    let total = await Comment.count({finish: 100}).exec();


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

        ctx.body = {
            success: true
        }
    } else {
        comment = new Comment({
            creation: creation._id,
            replyBy: user._id,
            replyTo: creation.author,
            content: commentData.content
        });

        comment = await comment.save();

        ctx.body = {
            success: true,
            data: [comment]
        }
    }

};