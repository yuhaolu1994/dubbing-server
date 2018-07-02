const mongoose = require('mongoose');
const robot = require('../service/robot');
const config = require('../../config/config');

let Video = mongoose.model('Video');
let Audio = mongoose.model('Audio');

exports.video = async (ctx, next) => {
    let body = ctx.request.body;
    let videoData = body.video;
    let user = ctx.session.user;

    if (!videoData || !videoData.key) {
        ctx.body = {
            success: false,
            err: 'video upload failed'
        };

        return next;
    }

    let video = await Video.findOne({
        qiniu_key: videoData.key
    }).exec();

    if (!video) {
        video = new Video({
            author: user._id,
            qiniu_key: videoData.key,
            persistentId: videoData.persistentId
        })
    }

    video = await video.save();

    let url = config.qiniu.video + video.qiniu_key;

    robot
        .uploadToCloudinary(url)
        .then((data) => {
            if (data && data.public_id) {
                video.public_id = data.public_id;
                video.detail = data;
                video.save();
            }
        });

    ctx.body = {
        success: true,
        data: video._id
    }
};

exports.audio = async (ctx, next) => {
    let body = ctx.request.body;
    let audioData = body.audio;
    let videoId = body.videoId;
    let user = ctx.session.user;

    if (!audioData || !audioData.public_id) {
        ctx.body = {
            success: false,
            err: 'audio upload failed'
        };

        return next;
    }

    let audio = await Audio.findOne({
        public_id: audioData.public_id
    }).exec();

    let video = await Video.findOne({
        _id: videoId
    }).exec();

    if (!audio) {
        let _audio = {
            author: user._id,
            public_id: audioData.public_id,
            detail: audioData
        };
        
        if (video) {
            _audio.video = video._id;
        }

        audio = new Audio(_audio);

        audio = await audio.save();
    }

    ctx.body = {
        success: true,
        data: audio._id
    }
};

