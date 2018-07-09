const mongoose = require('mongoose');
const robot = require('../service/robot');
const config = require('../../config/config');
const Promise = require('bluebird');
const xss = require('xss');
const _ = require('lodash');

let Video = mongoose.model('Video');
let Audio = mongoose.model('Audio');
let Creation = mongoose.model('Creation');

exports.up = async (ctx, next) => {
    let body = ctx.request.body;
    let user = ctx.session.user;
    let creation = await Creation.findOne({
        _id: body._id
    }).exec();

    if (!creation) {
        ctx.body = {
            success: false,
            err: 'video is null'
        };

        return next;
    }

    if (body.up === 'yes') {
        creation.votes.push(String(user._id));
    } else {
        creation.votes = _.without(creation.votes, String(user._id));
    }

    creation.up = creation.votes.length;
    await creation.save();

    ctx.body = {
        success: true
    }
};

let userFields = [
    'avatar',
    'nickname',
    'gender',
    'age',
    'breed'
];

exports.find = async (ctx) => {
    let feed = ctx.query.feed;
    let cid = ctx.query.cid;
    let count = 5;
    let query = {
        finish: 100
    };

    if (cid) {
        if (feed === 'recent') {
            query._id = {'$gt': cid}
        } else {
            query._id = {'$lt': cid}
        }
    }

    let data = await Creation
        .find(query)
        .sort({
            'meta.createAt': -1
        })
        .limit(count)
        .populate('author', userFields.join(' '))
        .exec();

    let total = await Creation.count({finish: 100}).exec();

    ctx.body = {
        success: true,
        data: data,
        total: total
    }
};

asyncMedia = (videoId, audioId) => {
    if (!videoId) return;

    console.log(videoId);
    console.log(audioId);

    let query = {
        _id: audioId
    };

    if (!audioId) {
        query = {
            video: videoId
        }
    }

    Promise.all([
        Video.findOne({_id: videoId}).exec(),
        Audio.findOne(query).exec()
    ])
        .then((data) => {
            console.log(data);

            let video = data[0];
            let audio = data[1];

            console.log('check data');

            if (!video || !video.public_id || !audio || !audio.public_id) {
                return;
            }

            console.log('async video and audio');

            let video_public_id = video.public_id;
            let audio_public_id = audio.public_id.replace(/\//g, ':');
            let videoName = video_public_id.replace(/\//g, '_') + '.mp4';
            let videoURL = 'https://res.cloudinary.com/dubbingapp/video/upload/e_volume:-100/e_volume:400,l_video:'
                + audio_public_id + '/' + video_public_id + '.mp4';
            let thumbName = video_public_id.replace(/\//g, '_') + '.jpg';
            let thumbURL = 'https://res.cloudinary.com/dubbingapp/video/upload/' + video_public_id + '.jpg';

            console.log('async video to qiniu');

            robot
                .saveToQiniu(videoURL, videoName)
                .catch((err) => {
                    console.log(err);
                })
                .then((response) => {
                    if (response && response.key) {
                        audio.qiniu_video = response.key;
                        audio.save()
                            .then((_audio) => {
                                Creation.findOne({
                                    video: video._id,
                                    audio: audio._id
                                }).exec()
                                    .then((_creation) => {
                                        if (_creation) {
                                            if (!_creation.qiniu_video) {
                                                _creation.qiniu_video = _audio.qiniu_video;
                                                _creation.save();
                                            }
                                        }
                                    });

                                console.log(_audio);
                                console.log('async video success');
                            });
                    }

                });

            robot
                .saveToQiniu(thumbURL, thumbName)
                .catch((err) => {
                    console.log(err);
                })
                .then((response) => {
                    if (response && response.key) {
                        audio.qiniu_thumb = response.key;
                        audio.save()
                            .then((_audio) => {
                                Creation.findOne({
                                    video: video._id,
                                    audio: audio._id
                                }).exec()
                                    .then((_creation) => {
                                        if (_creation) {
                                            if (!_creation.qiniu_thumb) {
                                                _creation.qiniu_thumb = _audio.qiniu_thumb;
                                                _creation.save();
                                            }
                                        }
                                    });

                                console.log(_audio);
                                console.log('async thumb success');
                            });
                    }

                })
        });

};

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

                video
                    .save()
                    .then((_video) => {
                        asyncMedia(_video._id)
                    })
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

    asyncMedia(video._id, audio._id);

    ctx.body = {
        success: true,
        data: audio._id
    }
};

exports.save = async (ctx, next) => {
    let body = ctx.request.body;
    let videoId = body.videoId;
    let audioId = body.audioId;
    let title = body.title;
    let user = ctx.session.user;

    let video = await Video.findOne({
        _id: videoId
    }).exec();

    let audio = await Audio.findOne({
        _id: audioId
    }).exec();

    if (!video || !audio) {
        ctx.body = {
            success: false,
            err: 'video or audio can not be null'
        };
        return next;
    }

    let creation = await Creation.findOne({
        audio: audioId,
        video: videoId
    }).exec();

    if (!creation) {
        let creationData = {
            author: user._id,
            title: xss(title),
            audio: audioId,
            video: videoId,
            finish: 20
        };

        let video_public_id = video.public_id;
        let audio_public_id = audio.public_id;

        if (video_public_id && audio_public_id) {
            creationData.cloudinary_thumb = 'http://res.cloudinary.com/dubbingapp/video/upload/'
                + video_public_id + '.jpg';
            creationData.cloudinary_video = 'http://res.cloudinary.com/dubbingapp/video/upload/e_volume:-100/e_volume:400,l_video:'
                + audio_public_id.replace(/\//g, ':') + '/' + video_public_id + '.mp4';
            creationData.finish += 20;
        }

        if (audio.qiniu_thumb) {
            creationData.qiniu_thumb = audio.qiniu_thumb;
            creationData.finish += 30;
        }

        if (audio.qiniu_video) {
            creationData.qiniu_video = audio.qiniu_video;
            creationData.finish += 30;
        }

        creation = new Creation(creationData);
    }

    creation = await creation.save();

    console.log(creation);

    ctx.body = {
        success: true,
        data: {
            _id: creation._id,
            finish: creation.finish,
            title: creation.title,
            qiniu_thumb: creation.qiniu_thumb,
            qiniu_video: creation.qiniu_video,
            author: {
                avatar: user.avatar,
                nickname: user.nickname,
                gender: user.gender,
                breed: user.breed,
                _id: user._id
            }
        }
    }

};



