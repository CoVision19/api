const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const controller = require('./controllers/cacheController');

const app = new Koa();
const router = new Router();
const timelineRouter = new Router( {prefix: '/timeline'});
const locationRouter = new Router( {prefix: '/location'});
require('./routes/home')({ router });
require('./routes/timeline')({ timelineRouter });
//require('./routes/location')({locationRouter});

// CONFIG //
const port = 3000;
const refreshCacheRateInMs = 60 * 60 * 1000;

// CACHE //
controller.CacheController.CreateCache(2020, 3, 1);
//controller.CacheController.CreateCache(2020, 4, 6);
controller.CacheController.GetCache().refreshCache();

setInterval(function() {
	controller.CacheController.GetCache().refreshCache();
}, refreshCacheRateInMs);

// HTTP SERVER //
app.use(Logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(timelineRouter.routes());
app.use(timelineRouter.allowedMethods());
//app.use(locationRouter.routes());
//app.use(locationRouter.allowedMethods());

app.listen(process.env.PORT || port);
console.log('Server started, listening on port ' + (process.env.PORT || port));
