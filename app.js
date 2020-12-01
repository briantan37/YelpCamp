const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const morgan = require('morgan');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const Review = require('./models/review');
const { campgroundSchema, reviewSchema } = require('./schemas');
const campgrounds = require('./routes/campgrounds');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database connection established');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    //console.log(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

//mongoose.set('useFindAndModify', false);
app.use('/campgrounds', campgrounds);
app.get('/', (req, res) => {
    res.render('home');
});


app.post(
    '/campgrounds/:id/reviews',
    validateReview,
    catchAsync(async (req, res, next) => {
        //console.log(req.body);
        const camp = await Campground.findById(req.params.id);
        const review = new Review(req.body.review);
        //console.log(review);
        camp.reviews.push(review);
        await review.save();
        await camp.save();
        res.redirect(`/campgrounds/${camp._id}`);
    })
);

app.delete(
    '/campgrounds/:id/reviews/:reviewId',
    catchAsync(async (req, res) => {
        const { id, reviewId } = req.params;
        await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        res.redirect(`/campgrounds/${id}`);
    })
);
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { status = '500' } = err;
    if (!err.message) err.message = 'Something went wrong';
    res.status(status).render('error', { err });
});

app.listen(3000, () => {
    console.log('Server live on port 3000');
});
