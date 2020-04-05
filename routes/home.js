const controller = require('../controllers/cacheController');

module.exports = ({ router }) => {

	router.get('/', (ctx, next) => {
		var today = new Date();
		var date = today.getUTCFullYear() + '-' + (today.getUTCMonth() + 1) + '-' + today.getUTCDate();
		var time = today.getUTCHours() + ":" + today.getUTCMinutes() + ":" + today.getUTCSeconds();

		ctx.body = {
			message: (controller.CacheController.GetCache().data == {} ? 'CoVision19 API up and running! No data fetched yet.' : 'CoVision19 API up and running! Data available.'),
			date: date,
			time: time,
			lastCacheUpdate: controller.CacheController.GetCache().lastTimeFetched,
			cache: controller.CacheController.GetCache().data
		};
	});
	
	// JOSH DEBUG: Just for testing. Please remove.
	// 
	router.get('/lookupTable/', (ctx, next) => {
		ctx.body = {
			lastCacheUpdate: controller.CacheController.GetCache().lastTimeFetched,
			lookupTable: controller.CacheController.GetCache().lookupTable
		};
	});
}
