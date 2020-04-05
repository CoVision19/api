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

	refreshCache() {
		var tmpDate = new Date(this.startDate);
		var today = new Date();
		var promises = [];
		
		// This builds the lookup table with the Combined_Key field
		// as the join key for now. We can't assign our own unique 
		// IDs to these tables (with a forEach or something), because
		// we have no guarantee that all tables have the same entries
		// or that they'll be in the same order.
		// 
		var yesterday = new Date(today);
		var lookupPromise;
		yesterday.setDate(yesterday.getDate() - 1);
		console.log('Fetching lookup table data...');
		lookupPromise = this.myFetch(this.formatDate(yesterday));
		lookupPromise.then(async (res) => {
			if (res.content !== null) {
				this.lookupTable = await csv({ignoreColumns: /(FIPS|Last_Update|Confirmed|Deaths|Recovered|Active|Combined_Key)/}).fromString(res.content);
			}
		}).catch(err => {
			console.log('AN ERROR OCCURRED WHILE BUILDING THE LOOKUP TABLE: ' + err);
		})
		

		console.log('Fetching COVID-19 data from ' + tmpDate + ' to ' + today + '...');
		while (tmpDate < today) {
			promises.push(this.myFetch(this.formatDate(tmpDate)));
			tmpDate.setUTCDate(tmpDate.getUTCDate() + 1);
		}
		Promise.all(promises).then(res => {
			res.forEach(async (elem) => {
				if (elem.content !== null || !(this.data[elem.date]))
					this.data[elem.date] = (elem.content === null ? null : await csv({ignoreColumns: /(FIPS|Admin2|Province_State,Country_Region,Last_Update,Lat,Long_)/}).fromString(elem.content));
			});

			this.lastTimeFetched = new Date();
			console.log('Cache built at ' + this.lastTimeFetched + '!\n');
		}).catch(err => {
			console.log('AN ERROR OCCURRED WHILE BUILDING THE CACHE: ' + err);
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

	// One possibility is to use a file that they already have, "UID_ISO_FIPS_LookUp_Table.csv".
	// We could use the UID, which is the FIPS for US regions, and larger numbers for other regions
	// (EXACTLY what we talked about). The only problem is there is no UID field in the data,
	// just a FIPS field, which is empty for non-US regions. The problem is, I still don't have a
	// good way of filling populating the data with those UIDs. We run into the same problem as above.
	// This call is commented out in app.js for now.
	// 
	refreshLookupTable() {
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

		prom.then(async(res) => {
			if (res.content !== null) {
				let jsonData = await csv({ignoreColumns: /(UID|iso2|iso3|code3|FIPS|Combined_Key)/}).fromString(res.content);
				let rows = res.content.split('\n');
				for (let i = 1; i < rows.length; i++) { 
					this.lookupTable[rows[i].split(',')[0]] = jsonData[i];
				}
			}
		})
	}

	formatDate(date) {
		var splitter = date.toISOString().split('T')[0].split('-');
		return splitter[1] + '-' + splitter[2] + '-' + splitter[0];
	}
}

module.exports = {
	CacheController: CacheController
}
