
module.exports = ({ router }) => {

	router.get('/', (ctx, next) => {
		var today = new Date();
		var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
		var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

		ctx.body = {
			message: 'CoVision19 API up and running! No data fetched yet.',
			status: 'not-ready',
			date: date,
			time: time
		};
	});
}