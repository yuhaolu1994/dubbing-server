const Router = require('koa-router');
const User = require("../app/controllers/user");
const App = require("../app/controllers/app");
const Creation = require('../app/controllers/creation');

const router = new Router({
    prefix: '/api'
});

// user
router.post('/u/signup', App.hasBody, User.signup);
router.post('/u/verify', App.hasBody, User.verify);
router.post('/u/update', App.hasBody, App.hasToken, User.update);

// app
router.post('/signature', App.hasBody, App.hasToken, App.signature);
router.post('/creations/video', App.hasBody, App.hasToken, Creation.video);
router.post('/creations/audio', App.hasBody, App.hasToken, Creation.audio);

module.exports = router;


