const Got = require('got');
const csv = require('csvtojson');
const Crypto = require('crypto');

class CacheController {
	constructor(startYear, startMonth, startDay) {
		this.startDate = new Date(startYear, startMonth - 1, startDay);
		this.baseURL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/';
		this.lastTimeFetched = null;
		this.data = {};
		this.lookupTable = {};
		this.checksums = {};
		this.startUID = 90000000;
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
		return (dateStr.match(/\d{4}-\d{2}-\d{2}/) && dateObj.getTime() === dateObj.getTime());
	}

	isDateInCache(dateStr) {
		return (dateStr in this.data);
	}

	isAlmostEqual(nbr1, nbr2) {
		return Math.abs(nbr1 - nbr2) <= 0.0001
	}

	refreshCache() {
		let tmpDate = new Date(this.startDate);
		let today = new Date();
		let promises = [];
		let lookupPromise;

		lookupPromise = this.fetchLookupTable();
		lookupPromise.then(async (res) => {
			if (res.content !== null) {
				this.lookupTable = await csv({ ignoreColumns: /(iso2|iso3|code3)/ }).fromString(res.content);

				console.log('Fetching COVID-19 data from ' + tmpDate + ' to ' + today + '...');
				while (tmpDate < today) {
					promises.push(this.myFetch(this.formatDateISOtoMDY(tmpDate)));
					tmpDate.setUTCDate(tmpDate.getUTCDate() + 1);
				}
				Promise.all(promises).then(async res => {
					let parsingPromises = [];
					res.forEach(elem => {
						parsingPromises.push(this.createParsingPromise(elem));
					});
					Promise.all(parsingPromises).then(res => {
						this.lastTimeFetched = new Date();
						console.log('Cache built at ' + this.lastTimeFetched + '!\n');
					}).catch(err => {
						console.log('AN ERROR OCCURRED WHILE PARSING THE CACHE: ' + err);
					});
				}).catch(err => {
					console.log('AN ERROR OCCURRED WHILE BUILDING THE CACHE: ' + err);
				});
			}
		}).catch(err => {
			console.log('AN ERROR OCCURRED WHILE BUILDING THE LOOKUP TABLE: ' + err);
		});
	}

	createParsingPromise(dayData) {
		return new Promise(async (resolve, reject) => {
			await this.parseDay(resolve, reject, dayData);
		});
	}

	async parseDay(resolve, reject, elem) {
		if (elem.content !== null || !(this.data[elem.date])) {
			this.data[elem.date] = (elem.content === null ? null : await csv().fromString(elem.content));
			if (this.data[elem.date] !== null) {
				this.data[elem.date].forEach(region => {
					this.lookupTable.forEach(entry => {
						if ((this.isAlmostEqual(entry.Lat, region.Lat) && this.isAlmostEqual(entry.Long_, region.Long_)) ||
							(this.isAlmostEqual(entry.Lat, region.Latitude) && this.isAlmostEqual(entry.Long_, region.Longitude))) {
							region.UID = entry.UID;
						}
					});
					if (!region.UID) {
						var newRegion = {
							UID: this.startUID,
							Lat: region.Lat || region.Latitude || '',
							Long_: region.Long_ || region.Longitude || '',
							FIPS: region.FIPS || '',
							Admin2: region.Admin2 || '',
							Province_State: region.Province_State || region['Province/State'] || '',
							Country_Region: region.Country_Region || region['Country/Region'] || '',
							Combined_Key: region.Combined_Key || ''
						}
						this.lookupTable.push(newRegion);
						region.UID = toString(this.startUID);
						this.startUID += 1;
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
			console.log('Parsed: ' + elem.date);
			resolve(null);
		} else {
			console.log('Ignored: ' + elem.date);
			resolve(null);
		}
	}

	myFetch(dateString) {
		let date = this.formatDateMDYtoYMD(dateString);
		let prom = new Promise((resolve, reject) => {
			Got(this.baseURL + 'csse_covid_19_daily_reports/' + dateString + '.csv').then(res => {
				console.log('Fetched: ' + date);
				// DEBUG
				console.log('HASHING part:' + this.isHashSame(date, JSON.stringify(res.body)));
				if (res.body && !this.isHashSame(date, JSON.stringify(res.body))) {
					this.addHash(date, JSON.stringify(res.body));
					resolve({ date: date, content: res.body });
				}
				resolve({ date: date, content: null });
			}).catch(err => {
				console.log('Reject (' + err.response.body.replace(/(\r\n|\n|\r)/gm, "") + '): ' + dateString);
				resolve({ date: date, content: null });
			});
		});
		return prom;
	}

	fetchLookupTable() {
		console.log('Fetching UID lookup table...');
		let prom = new Promise((resolve, reject) => {
			Got(this.baseURL + 'UID_ISO_FIPS_LookUp_Table.csv').then(res => {
				resolve({ content: res.body });
			}).catch(err => {
				console.log('Reject (' + err.response.body.replace(/(\r\n|\n|\r)/gm, "") + ')');
				resolve({ content: null });
			});
		});
		return prom;
	}

	formatDateMDYtoYMD(date) {
		var splitDate = date.split('-');
		return splitDate[2] + '-' + splitDate[0] + '-' + splitDate[1];
	}

	formatDateISOtoMDY(date) {
		var splitter = date.toISOString().split('T')[0].split('-');
		return splitter[1] + '-' + splitter[2] + '-' + splitter[0];
	}

	async awaitForEach(array, callback) {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
	}

	addHash(date, str) {
		this.checksums[date] = Crypto.createHash('sha1').update(str).digest('hex');
	}

	isHashSame(date, str) {
		if (!str || str === null)
			return false;
		let hashToCheck = Crypto.createHash('sha1').update(str).digest('hex');
		// DEBUG
		console.log("NEW HASH:" + hashToCheck);
		console.log("EXISTING HASH IN TABLE: " + this.checksums[date]);
		return (date in this.checksums && this.checksums[date] === hashToCheck);
	}
}

module.exports = {
	CacheController: CacheController
}
