const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const db = 'mongodb://localhost/imooc-app';

mongoose.Promise = require('bluebird');
// mongoose.Promise = global.Promise;
mongoose.connect(db);

// require('./app/models/user');

let models_path = path.join(__dirname, '/app/models');
let walk = function (modelPath) {
    fs
        .readdirSync(modelPath)
        .forEach(function (file) {
            let filePath = path.join(modelPath, '/' + file);
            // retrieve information about the file pointed to by pathname
            let stat = fs.statSync(filePath);
            if (stat.isFile()) {
                // The test() method executes a search for a match
                // between a regular expression and a specified string.
                // Returns true or false.
                // / regular expression /
                // preceding the decimal point with \ means
                // the pattern must look for the literal character '.'
                if (/(.*)\.(js|coffee)/.test(file)) {
                    require(filePath);
                }
            } else if (stat.isDirectory()) {
                // recursion use walk
                walk(filePath);
            }
        })
};

walk(models_path);

const Koa = require('koa');
const logger = require('koa-logger');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');

const router = require('./config/routes');

const app = new Koa();

app.keys = ['immoc'];
// Development style logger middleware
app.use(logger());

// if you prefer all default config, just use => app.use(session(app))
app.use(session(app));

// the parsed body will store in ctx.request.body
app.use(bodyParser());

app
    .use(router.routes())
    .use(router.allowedMethods());

app.listen(3000);
console.log('Listening: 3000');
