const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

let productCategoryEnum = ['E-Waste', 'Plastic'];
let productUnitEnum = ['KG', 'PC'];

var productSchema = new Schema({
	product_name: {
		type: String,
		required: true,
		unique: true,
	},
	product_category: {
		type: String,
		enum: productCategoryEnum,
		required: true,
	},
	product_unit: {
		type: String,
		enum: productUnitEnum,
		required: true,
	},
	product_info: {
		type: String,
	},
});

productSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('Product', productSchema);
