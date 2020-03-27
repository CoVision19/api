const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');

const app = new Koa();
const router = new Router();
require('./routes/home')({ router });

app.use(Logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);