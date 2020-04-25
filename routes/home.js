const controller = require('../controllers/cacheController');

module.exports = ({ router }) => {

	router.get('/', (ctx, next) => {
		var today = new Date();
		var date = today.getUTCFullYear() + '-' + (today.getUTCMonth() + 1) + '-' + today.getUTCDate();
		var time = today.getUTCHours() + ":" + today.getUTCMinutes() + ":" + today.getUTCSeconds();

		ctx.body = {
			message: (controller.CacheController.GetCache().lastTimeFetched === null ? 'CoVision19 API up and running! No data fetched yet.' : 'CoVision19 API up and running! Data available.'),
			date: date,
			time: time,
			lastCacheUpdate: controller.CacheController.GetCache().lastTimeFetched,
			checksums: controller.CacheController.GetCache().checksums
		};
	});

	router.get('/update', (ctx, next) => {
		controller.CacheController.GetCache().refreshCache();
	});
}
