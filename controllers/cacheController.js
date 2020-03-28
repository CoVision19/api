const Got = require('got');

class CacheController {
	constructor(startYear, startMonth, startDay) {
		this.startDate = new Date(startYear, startMonth, startDay);
		this.baseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';
	}

	initCache() {
		console.log('Fetching COVID-19 data...');
		var launchedRequest = 0;
		var finishedRequest = 0;
		var tmpDate = this.startDate;
		var today = new Date();
		while (tmpDate < today) {
			var date = ('0' + tmpDate.getMonth()).slice(-2) + '-'
				+ ('0' + (tmpDate.getDate()+1)).slice(-2) + '-'
				+ tmpDate.getFullYear();
			Got(this.baseURL + date + '.csv').then(response => {
				console.log(response.body);
			}).catch(error => {
				console.log('An error occured while making the cache:' + error.response.body);
			});
			tmpDate.setHours(tmpDate.getHours() + 24);
		}
		console.log('Cache built, ready to start!');
	}
}

module.exports = {
	CacheController: CacheController
}