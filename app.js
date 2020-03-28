const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const controller = require('./controllers/cacheController');

const app = new Koa();
const router = new Router();
require('./routes/home')({ router });

// CONFIG //
const port = 3000;

app.use(Logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(port);
console.log('Server started, listening on port ' + port);
let test = new controller.CacheController(2020, 1, 22);
test.initCache();