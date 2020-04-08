const Got = require('got');
const csv = require("csvtojson");

class CacheController {
	constructor(startYear, startMonth, startDay) {
		this.startDate = new Date(startYear, startMonth - 1, startDay);
		this.baseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/';
		this.lastTimeFetched = null;
		this.data = {};
		this.lookupTable = {};
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

	// Member functions
	isValidDate(dateStr) {
		var dateObj = new Date(dateStr);

		// If date is invalid, dateObj.getTime() returns NaN, which is never equal to itself
        //
        return (dateStr.match(/\d{4}-\d{2}-\d{2}/) && dateObj.getTime() === dateObj.getTime());
	}

	isDateInCache(dateStr) {
		return (dateStr in this.data);
	}

	refreshCache() {
		var tmpDate = new Date(this.startDate);
		var today = new Date();
		var promises = [];
		var lookupPromise;

		console.log('Fetching lookup table data...');
		lookupPromise = this.fetchLookupTable();
		lookupPromise.then(async (res) => {
			if (res.content !== null) {
				this.lookupTable = await csv().fromString(res.content);

				console.log('Fetching COVID-19 data from ' + tmpDate + ' to ' + today + '...');
				while (tmpDate < today) {
					promises.push(this.myFetch(this.formatDate(tmpDate)));
					tmpDate.setUTCDate(tmpDate.getUTCDate() + 1);
				}
				Promise.all(promises).then(async res => {
					await this.awaitForEach(res, async (elem) => {
						var splitDate = elem.date.split('-');
						var dateKey = splitDate[2] + '-' + splitDate[0] + '-' + splitDate[1];
						if (elem.content !== null || !(this.data[dateKey])) {
							this.data[dateKey] = (elem.content === null ? null : await csv({ignoreColumns: /(FIPS|Admin2|Province_State|Country_Region|Last_Update|Combined_Key)/}).fromString(elem.content));
							this.lookupTable.forEach( entry => {
								if (this.data[dateKey] !== null) {
									this.data[dateKey].forEach( region => {
										if (entry.Lat == region.Lat && entry.Long_ == region.Long_) {
											region.UID = entry.UID;
											delete region.Lat;
											delete region.Long_;
										}
									});
								}
							});
						}
				
					});

					this.lastTimeFetched = new Date();
					console.log('Cache built at ' + this.lastTimeFetched + '!\n');
				}).catch(err => {
					console.log('AN ERROR OCCURRED WHILE BUILDING THE CACHE: ' + err);
				})
			}
		}).catch(err => {
			console.log('AN ERROR OCCURRED WHILE BUILDING THE LOOKUP TABLE: ' + err);
		})
	}

	async myFetch(dateString) {
		let prom = new Promise((resolve, reject) => {
			Got(this.baseURL + 'csse_covid_19_daily_reports/' + dateString + '.csv').then(res => {
				console.log('Fetched: ' + dateString);
				resolve({date: dateString, content: res.body});
			})
			.catch(err => {
				console.log('Reject (' + err.response.body.replace(/(\r\n|\n|\r)/gm,"") + '): ' + dateString);
				resolve({date: dateString, content: null});
			})
		})
		return prom;
	}

	fetchLookupTable() {
		console.log('Fetching UID lookup table...'); 
		let prom = new Promise((resolve, reject) => {
			Got(this.baseURL + 'UID_ISO_FIPS_LookUp_Table.csv').then(res => {
				resolve({content: res.body});
			})
			.catch(err => {
				console.log('Reject (' + err.response.body.replace(/(\r\n|\n|\r)/gm,"") + ')');
				resolve({content: null});
			})
		})

		return prom;
	}

	formatDate(date) {
		var splitter = date.toISOString().split('T')[0].split('-');
		return splitter[1] + '-' + splitter[2] + '-' + splitter[0];
	}

	async awaitForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
		  await callback(array[index], index, array);
		}
	  }
}

module.exports = {
	CacheController: CacheController
}
