const controller = require('../controllers/cacheController');

module.exports = ({ locationRouter }) => {
    locationRouter.get('/', (ctx, next) => {
        const cache = controller.CacheController.GetCache();

        if (cache.lastTimeFetched === null) {
            ctx.response.status = 503;
            ctx.body = {
                status: 503,
                message: 'Cache not ready.'
            }
            return;
        }
        ctx.body = {
            status: 200,
            message: 'Success',
            data: cache.lookupTable
        }
    });
}
