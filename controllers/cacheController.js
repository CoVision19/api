const Got = require('got');

class CacheController {
	constructor(startYear, startMonth, startDay) {
		this.startDate = new Date(startYear, startMonth - 1, startDay);
		this.baseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';
		this.lastTimeFetched = null;
		this.data = null;
	}

	// Singleton functions
	static instance = null;

	static CreateCache(year, month, day) {
		if (CacheController.instance === null) {
			CacheController.instance = new CacheController(year, month, day);
		}
	}

	static GetCache() {
		return CacheController.instance;
	}

	refreshCache() {
		var tmpDate = this.startDate;
		var today = new Date();
		var promises = [];
		console.log('Fetching COVID-19 data from ' + tmpDate + ' to ' + today + '...');
		while (tmpDate < today) {
			var date = ('0' + tmpDate.getUTCMonth()).slice(-2) + '-'
				+ ('0' + (tmpDate.getUTCDate()+1)).slice(-2) + '-'
				+ tmpDate.getUTCFullYear();
			promises.push(this.myFetch(date));
			tmpDate.setHours(tmpDate.getHours() + 24);
		}
		Promise.all(promises).then(res => {
			let obj = {};
			res.forEach(elem => {
				obj[elem.date] = elem.content;
			});
			this.data = obj;
			this.lastTimeFetched = new Date();
			console.log('Cache built at ' + this.lastTimeFetched + '!\n');
		}).catch(err => {
			console.log('AN ERROR OCCURRED WHILE BUILDING THE CACHE: ' + err);
		})
	}

	async myFetch(date) {
		let prom = new Promise((resolve, reject) => {
			Got(this.baseURL + date + '.csv').then(res => {
				console.log('Fetched: ' + date);
				resolve({date: date, content: res.body});
			})
			.catch(err => {
				console.log('Reject (' + err.response.body.replace(/(\r\n|\n|\r)/gm,"") + '): ' + date);
				resolve({date: date, content: null});
			})
		})
		return prom;
	}
}

module.exports = {
	CacheController: CacheController
}