const controller = require('../controllers/cacheController');

module.exports = ({ timelineRouter }) => {

	timelineRouter.get('/date/:date', (ctx, next) => {
        var dateObj = new Date(ctx.params.date);

        // If date is invalid, dateObj.getTime() returns NaN, which is never equal to itself
        //
        if (ctx.params.date.match(/\d{4}-\d{2}-\d{2}/) && dateObj.getTime() === dateObj.getTime()) {
            if (!controller.CacheController.GetCache().data) {
                ctx.body = {
                    status: 404,
                    message: 'Cache not found'
                }
            }
            else {
                let msg = {}
                msg[ctx.params.date] = controller.CacheController.GetCache().data[ctx.params.date];
                ctx.body = {
                    status: 200,
                    message: msg
                };
            }
        }
        else {
            ctx.body = {
                status: 400,
                message: 'Not a valid date'
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
