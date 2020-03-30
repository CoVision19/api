const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const controller = require('./controllers/cacheController');

const app = new Koa();
const router = new Router();
require('./routes/home')({ router });

// CONFIG //
const port = 3000;
const refreshCacheRateInMs = 5000;

// CACHE //
//controller.CacheController.CreateCache(2020, 1, 22);
controller.CacheController.CreateCache(2020, 3, 27);
controller.CacheController.GetCache().refreshCache();
setInterval(function() {
	controller.CacheController.GetCache().refreshCache();
}, refreshCacheRateInMs);

// HTTP SERVER //
app.use(Logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(port);
console.log('Server started, listening on port ' + port);