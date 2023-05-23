var { City, Country } = require('country-state-city');
const Config = require('./shared/config');

function getCitiesOfCountry(req, res, next) {
	var countries = Config.SERVICEABLE_CITIES.filter(
		(obj) => obj.country === req.params.country,
	);
	console.log('countries', countries);
	var cityNames = countries.map((el) => el.cities).flat();
	if (cityNames) {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		console.log('res cityNames', cityNames);
		res.json(cityNames);
	} else {
		City.getCitiesOfCountry('IN')
			.then((cities) => {
				var cityNames = cities.map((city) => city.name);
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				console.log('res cityNames', cityNames);
				res.json(cityNames);
			})
			.catch((err) => {
				console.log(err);
				let error = new Error(err);
				error.status = 500;
				next(error);
			});
	}
}

function getCountries(req, res, next) {
	var countryNames = Config.SERVICEABLE_COUNTRIES;
	console.log('country names', countryNames);
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	console.log('res countryNames', countryNames);
	res.json(countryNames);
}

module.exports = {
	getCitiesOfCountry,
	getCountries,
};
