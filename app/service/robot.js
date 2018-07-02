const qiniu = require('qiniu');
const config = require('../../config/config');
const sha1 = require("sha1");
const uuidv4 = require('uuid/v4');
const cloudinaty = require('cloudinary');
const Promise = require('bluebird');

const accessKey = config.qiniu.AK;
const secretKey = config.qiniu.SK;

cloudinaty.config(config.cloudinary);

exports.getQiniuToken = (body) => {
    let type = body.type;
    let key = uuidv4();
    let options = {
        persistentNotifyUrl: config.notify
    };
    let putPolicy;

    if (type === 'avatar') {
        key += '.jpeg';
        putPolicy = new qiniu.rs.PutPolicy('avatar:' + key);
    }
    else if (type === 'video') {
        key += '.mp4';
        options.scope = 'video:' + key;
        options.persistentOps = 'avthumb/mp4/an/1';
        putPolicy = new qiniu.rs.PutPolicy(options);
    }
    else if (type === 'video') {
        key += '.aac';
    }

    let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

    let uploadToken = putPolicy.uploadToken(mac);

    return {
        key: key,
        token: uploadToken
    };
};

exports.uploadToCloudinary = (url) => {
    return new Promise((resolve, reject) => {
        cloudinaty.uploader.upload(url, (result) => {
            if (result && result.public_id) {
                resolve(result);
            } else {
                reject(result);
            }
        }, {
            resource_type: 'video',
            folder: 'video'
        })
    })
};

exports.getCloudinaryToken = (body) => {
    let type = body.type;
    let timestamp = body.timestamp;
    let folder;
    let tags;

    if (type === 'avatar') {
        folder = 'avatar';
        tags = 'app,avatar';
    } else if (type === 'video') {
        folder = 'video';
        tags = 'app,video';
    } else if (type === 'audio') {
        folder = 'audio';
        tags = 'app,audio';
    }

    // data.data
    let signature = 'folder=' + folder + '&tags=' + tags
        + '&timestamp=' + timestamp + config.cloudinary.api_secret;

    signature = sha1(signature);
    let key = uuidv4();

    return {
        token: signature,
        key: key
    };
};