const controller = require('../controllers/cacheController');

module.exports = ({ timelineRouter }) => {

	timelineRouter.get('/date/:date', (ctx, next) => {
        const cache = controller.CacheController.GetCache();
        let data = {}

        if (cache.lastTimeFetched === null) {
            ctx.response.status = 503;
            ctx.body = {
                status: 503,
                message: 'Cache not ready.'
            }
            return;
        }

        if (cache.isValidDate(ctx.params.date) && cache.isDateInCache(ctx.params.date)) {
            data[ctx.params.date] = cache.data[ctx.params.date];
            ctx.body = {
                status: 200,
                message: 'Success.',
                data: data
            };
        } else if (cache.isValidDate(ctx.params.date) && !cache.isDateInCache(ctx.params.date)) {
            ctx.response.status = 404;
            ctx.body = {
                status: 404,
                message: 'Date not in cache.'
            };
        } else if (!cache.isValidDate(ctx.params.date)) {
            ctx.response.status = 400;
            ctx.body = {
                status: 400,
                message: 'Not a valid date.'
            }
        } else {
            ctx.response.status = 400;
            ctx.body = {
                status: 400,
                message: 'Invalid request.'
            }
        }
    });

    timelineRouter.get('/daterange/:range', (ctx, next) => {
        const cache = controller.CacheController.GetCache();
        var dates = ctx.params.range.split('_');

        if (cache.lastTimeFetched === null) {
            ctx.response.status = 503;
            ctx.body = {
                status: 503,
                message: 'Cache not ready.'
            }
            return;
        }

        if (dates.length === 2 && cache.isValidDate(dates[0]) && cache.isValidDate(dates[1])) {
            let data = {}
            let currentDate = new Date(dates[0]);
            let endDate = new Date(dates[1]);

            while (currentDate <= endDate) {
                let dateString = currentDate.toISOString().split('T')[0];
                data[dateString] = (cache.isDateInCache(dateString) ? cache.data[dateString] : null);
                currentDate.setDate( currentDate.getDate() + 1);
            }
            ctx.body = {
                status: 200,
                message: 'Success.',
                data: data
            };
        } else if (dates.length !== 2 || !cache.isValidDate(dates[0]) || !cache.isValidDate(date[1])) {
            ctx.response.status = 400;
            ctx.body = {
                status: 400,
                message: 'Not a valid range.'
            }
        } else {
            ctx.response.status = 400;
            ctx.body = {
                status: 400,
                message: 'Invalid request.'
            }
        }
    });
}
