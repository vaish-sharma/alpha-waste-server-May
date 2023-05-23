const nodeGeocoder = require('node-geocoder');
const kmeans = require('node-kmeans');
const nominatim = require('nominatim-client');
const client = nominatim.createClient({
	useragent: 'Alpha Waste', // The name of your application
	referer: 'https://udi8pw.sse.codesandbox.io/', // The referer link
});
// var HttpsAdapter = require('/sandbox/node_modules/node-geocoder/lib/httpadapter/httpsadapter.js');
// var httpAdapter = new HttpsAdapter(null, {
// 	headers: {
// 		'user-agent': 'Alpha Waste',
// 	},
// });

let options = {
	provider: 'google',
	API_KEY: '',
	// httpAdapter: httpAdapter,
	'user-agent': 'Alpha Waste',
};

let geoCoder = nodeGeocoder(options);

function geocode(address) {
	return geoCoder
		.geocode(address)
		.then((res) => {
			console.log('geocode res', res);
			return res;
		})
		.catch((err) => {
			console.log('geocode err', err);
			return err;
		});
}

function geocodeWNominatim(address) {
	console.log('address', address);
	const query = {
		q: '781002',
		addressdetails: '1',
	};

	return client.search(query).then((res) => {
		console.log('res', res);
		return res;
	});
}

function clusterise(geopoints, clusterCount) {
	return new Promise((resolve, reject) => {
		kmeans.clusterize(geopoints, { k: clusterCount }, (err, result) => {
			if (err) {
				return reject(err);
			} else {
				return resolve(result);
			}
		});
	});
}

module.exports = {
	geocode,
	clusterise,
};
