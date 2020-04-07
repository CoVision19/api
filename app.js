const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const controller = require('./controllers/cacheController');

const app = new Koa();
const router = new Router();
require('./routes/home')({ router });

// CONFIG //
const port = 3000;
const refreshCacheRateInMs = 60 * 60 * 1000;

// CACHE //
//controller.CacheController.CreateCache(2020, 1, 22);
controller.CacheController.CreateCache(2020, 3, 30);
//controller.CacheController.GetCache().refreshLookupTable();
controller.CacheController.GetCache().refreshCache();

//setInterval(function() {
//	controller.CacheController.GetCache().refreshCache();
//}, refreshCacheRateInMs);

// HTTP SERVER //
app.use(Logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(process.env.PORT || port);
console.log('Server started, listening on port ' + (process.env.PORT || port));
