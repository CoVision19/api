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

	isAlmostEqual(nbr1, nbr2) {
		return Math.abs(nbr1 - nbr2) <= 0.0001
	}

	refreshCache() {
		var tmpDate = new Date(this.startDate);
		var today = new Date();
		var promises = [];
		var lookupPromise;
		var startUID = 90000000;

		lookupPromise = this.fetchLookupTable();
		lookupPromise.then(async (res) => {
			if (res.content !== null) {
				this.lookupTable = await csv({ignoreColumns: /(iso2|iso3|code3)/}).fromString(res.content);

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
							//var columns = /(FIPS|Admin2|Province_State|Country_Region|Last_Update|Combined_Key|Province\/State|Country\/Region|Last\ Update)/
							this.data[dateKey] = (elem.content === null ? null : await csv().fromString(elem.content));
							if (this.data[dateKey] !== null) {
								this.data[dateKey].forEach( region => {
									this.lookupTable.forEach( entry => {
										if ((this.isAlmostEqual(entry.Lat, region.Lat) && this.isAlmostEqual(entry.Long_, region.Long_)) ||
											(this.isAlmostEqual(entry.Lat, region.Latitude) && this.isAlmostEqual(entry.Long_, region.Longitude))) {
											region.UID = entry.UID;
										}
									});
									if (!region.UID) {
										var newRegion = {
											UID: startUID,
											Lat: region.Lat || region.Latitude || '',
											Long_: region.Long_ || region.Longitude || '',
											FIPS: region.FIPS || '',
											Admin2: region.Admin2 || '',
											Province_State: region.Province_State || region['Province/State'] || '',
											Country_Region: region.Country_Region || region['Country/Region'] || '',
											Combined_Key: region.Combined_Key || ''
										}
										this.lookupTable.push(newRegion);
										region.UID = toString(startUID);
										startUID += 1;
									}
									delete region.Lat;
									delete region.Long_;
									delete region.Latitude;
									delete region.Longitude;
									delete region.FIPS;
									delete region.Admin2;
									delete region.Province_State;
									delete region.Country_Region;
									delete region.Last_Update;
									delete region.Combined_Key;
									delete region['Province/State'];
									delete region['Country/Region'];
									delete region['Last Update'];
								});
							}
						}
						console.log('Parsed: ' + dateKey);
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
