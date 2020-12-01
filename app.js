const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const morgan = require("morgan");
const ejsMate = require("ejs-mate");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const { campgroundSchema, reviewSchema } = require("./schemas");

const methodOverride = require("method-override");
const Review = require("./models/review");
const Campground = require("./models/campground");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.engine("ejs", ejsMate);
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const validateCampground = (req, res, next) => {
	const { error } = campgroundSchema.validate(req.body);
	if (error) {
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

const validateReview = (req, res, next) => {
	const { error } = reviewSchema.validate(req.body);
	//console.log(req.body);
	if (error) {
		const msg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(msg, 400);
	} else {
		next();
	}
};

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
	validateCampground,
	catchAsync(async (req, res, next) => {
		//if (!req.body.campground) throw new ExpressError("Invalid Campground Data", 400);
		const camp = new Campground(req.body.campground);
		await camp.save();
		console.log(`Inserted camp to the database : ${camp}`);
		res.redirect(`/campgrounds/${camp._id}`);
	})
);

app.get(
	"/campgrounds/:id",
	catchAsync(async (req, res, next) => {
		const camp = await Campground.findById(req.params.id).populate("reviews");
		console.log(camp);
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
	validateCampground,
	catchAsync(async (req, res, next) => {
		const { id } = req.params;
		const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
		console.log(`Update camp to the database : ${camp}`);
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

app.post(
	"/campgrounds/:id/reviews",
	validateReview,
	catchAsync(async (req, res, next) => {
		console.log(req.body);
		const camp = await Campground.findById(req.params.id);
		const review = new Review(req.body.review);
		console.log(review);
		camp.reviews.push(review);
		await review.save();
		await camp.save();
		res.redirect(`/campgrounds/${camp._id}`);
	})
);

app.delete(
	"/campgrounds/:id/reviews/:reviewId",
	catchAsync(async (req, res) => {
		const { id, reviewId } = req.params;
		await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
		await Review.findByIdAndDelete(reviewId);
		res.redirect(`/campgrounds/${id}`);
	})
);
app.all("*", (req, res, next) => {
	next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
	const { status = "500" } = err;
	if (!err.message) err.message = "Something went wrong";
	res.status(status).render("error", { err });
});

app.listen(3000, () => {
	console.log("Server live on port 3000");
});
