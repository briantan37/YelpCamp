const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelper");

mongoose.connect("mongodb://localhost:27017/yelp-camp", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
	console.log("Database connection established");
});

const randPicker = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
	await Campground.deleteMany({});
	for (let i = 0; i < 50; i++) {
		const random1000 = Math.floor(Math.random() * 1000);
		const price = Math.floor(Math.random() * 100) + 11;
		const camp = new Campground({
			author: '5fcb1cfdfb1475075b33501c',
			location: `${cities[random1000].city}, ${cities[random1000].state}`,
			title: `${randPicker(descriptors)} ${randPicker(places)}`,
			geometry: { 
				type: 'Point', 
				coordinates: [ cities[random1000].longitude, cities[random1000].latitude ] 
			},
			images: [
				{
					url: 'https://res.cloudinary.com/ddqrpwi38/image/upload/v1607469552/YelpCamp/munisu3pv4rsmqr5igfr.jpg',
					filename: 'YelpCamp/munisu3pv4rsmqr5igfr'
				},
				{
					url: 'https://res.cloudinary.com/ddqrpwi38/image/upload/v1607469552/YelpCamp/qewostlhk3xcytai9jnc.jpg',
					filename: 'YelpCamp/qewostlhk3xcytai9jnc'
				}
			],
			description:
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum sodales nisi, et aliquet sapien varius ac. Fusce gravida nec ex in pretium. Cras aliquet tristique metus non ultricies. Aenean eget mauris vitae diam iaculis gravida ac id mauris. Cras hendrerit vestibulum nisl, in aliquam augue facilisis vitae. Praesent finibus tortor quis velit sollicitudin, sed tristique eros bibendum. Sed pharetra viverra lacus, semper bibendum lacus ornare ac.",
			price: price,
		});
		await camp.save();
	}
};

seedDB().then(() => {
	mongoose.connection.close();
});
