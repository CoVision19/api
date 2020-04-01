const Got = require('got');
const csv = require("csvtojson");

class CacheController {
	constructor(startYear, startMonth, startDay) {
		this.startDate = new Date(startYear, startMonth - 1, startDay);
		this.baseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';
		this.lastTimeFetched = null;
		this.data = {};
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
		var tmpDate = new Date(this.startDate);
		var today = new Date();
		var promises = [];
		console.log('Fetching COVID-19 data from ' + tmpDate + ' to ' + today + '...');
		while (tmpDate < today) {
			var splitter = tmpDate.toISOString().split('T')[0].split('-');
			var date = splitter[1] + '-' + splitter[2] + '-' + splitter[0];
			promises.push(this.myFetch(date));
			tmpDate.setUTCDate(tmpDate.getUTCDate() + 1);
		}
		Promise.all(promises).then(res => {
			res.forEach(async (elem) => {
				if (elem.content !== null || !(this.data[elem.date]))
					this.data[elem.date] = await csv({ignoreColumns: /(FIPS|Combined_Key)/}).fromString(elem.content);
			});
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