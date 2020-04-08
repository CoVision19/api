const controller = require('../controllers/cacheController');

module.exports = ({ timelineRouter }) => {

	timelineRouter.get('/date/:date', (ctx, next) => {
        const cache = controller.CacheController.GetCache();
        let data = {}

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
        var datesValid = true;        
        var dates = ctx.params.range.split('_');
        var startDateObj;
        var endDateObj;

        // Validate both dates
        //
        if (dates.length == 2) {
            startDateObj = new Date(dates[0]);
            endDateObj = new Date(dates[1]);

            if (!dates[0].match(/\d{4}-\d{2}-\d{2}/) || startDateObj.getTime() !== startDateObj.getTime() ||
                !dates[1].match(/\d{4}-\d{2}-\d{2}/) || endDateObj.getTime() !== endDateObj.getTime())
                    datesValid = false;  
        }
        else 
            datesValid = false;

        // If either date is invalid
        //
        if (!datesValid) {
            ctx.body = {
                status: 400,
                message: 'Not a valid date'
            }
        }

        else {
            if (!controller.CacheController.GetCache().data) {
                ctx.body = {
                    status: 404,
                    message: 'Cache not found'
                }
            }
            else {
                var msg = {};
                var currentDate = startDateObj;
                while ( currentDate <= endDateObj) {
                    let dateString = currentDate.toISOString().split('T')[0];
                    msg[dateString] = controller.CacheController.GetCache().data[dateString];
                    currentDate.setDate( currentDate.getDate() + 1);
                }

                ctx.body = {
                    status: 200,
                    message: msg
                };
            }           
        }
    });
}
