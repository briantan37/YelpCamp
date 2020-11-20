const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const Campground = require("./models/campground");

const methodOverride = require("method-override");

const app = express();
const e = require("express");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

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

app.get("/", (req, res) => {
	res.render("home");
});

app.get(
	"/campgrounds",
	catchAsync(async (req, res, next) => {
		const allCamps = await Campground.find({});
		//console.log(allCamps);
		res.render("campgrounds/index", { allCamps });
	})
);

app.get("/campgrounds/new", (req, res) => {
	res.render("campgrounds/new");
});

app.post(
	"/campgrounds",
	catchAsync(async (req, res, next) => {
		const camp = new Campground(req.body.campground);
		await camp.save();
		console.log(`Inserted camp to the database : ${camp}`);
		res.redirect(`/campgrounds/${camp._id}`);
	})
);

app.get(
	"/campgrounds/:id",
	catchAsync(async (req, res, next) => {
		const camp = await Campground.findById(req.params.id);
		//console.log(camp);
		res.render("campgrounds/show", { camp });
	})
);

app.get(
	"/campgrounds/:id/edit",
	catchAsync(async (req, res, next) => {
		const camp = await Campground.findById(req.params.id);
		res.render("campgrounds/edit", { camp });
	})
);

app.put(
	"/campgrounds/:id",
	catchAsync(async (req, res, next) => {
		const { id } = req.params;
		const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
		//console.log(camp);
		res.redirect(`/campgrounds/${camp._id}`);
	})
);

app.delete(
	"/campgrounds/:id",
	catchAsync(async (req, res, next) => {
		const { id } = req.params;
		const camp = await Campground.findByIdAndDelete(id);
		res.redirect("/campgrounds");
	})
);

app.all("*", (req, res, next) => {
	next(new ExpressError("Page Not Found", "404"));
});

app.use((err, req, res, next) => {
	const { status = "500", message = "Something went wrong" } = err;
	res.status(status).send(message);
});

app.listen(3000, () => {
	console.log("Server live on port 3000");
});
