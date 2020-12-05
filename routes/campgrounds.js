const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');

const Campground = require('../models/campground');

const { campgroundSchema } = require('../schemas');
const { isLoggedIn } = require('../middleware');

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

router.get('/', catchAsync(async (req, res, next) => {
        const allCamps = await Campground.find({});
        //console.log(allCamps);
        res.render('campgrounds/index', { allCamps });
    })
);

router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new');
});

router.post('/', isLoggedIn, validateCampground, catchAsync(async (req, res, next) => {
        const camp = new Campground(req.body.campground);
        await camp.save();
        req.flash('success', 'Successfully made a new campground');
        res.redirect(`/campgrounds/${camp._id}`);
    })
);

router.get('/:id', catchAsync(async (req, res, next) => {
        const camp = await Campground.findById(req.params.id).populate('reviews');
        if(!camp) {
            req.flash('error', 'Campground not found!');
            res.redirect('/campgrounds');
        }
        res.render('campgrounds/show', { camp });
    })
);

router.get('/:id/edit', isLoggedIn, catchAsync(async (req, res, next) => {
        const camp = await Campground.findById(req.params.id);
        if(!camp) {
            req.flash('error', 'Campground not found!');
            res.redirect('/campgrounds');
        }
        res.render('campgrounds/edit', { camp });
    })
);

router.put('/:id', isLoggedIn, validateCampground, catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
        req.flash('success', 'Successfully updated campground!');
        //console.log(`Update camp to the database : ${camp}`);
        res.redirect(`/campgrounds/${camp._id}`);
    })
);

router.delete('/:id', isLoggedIn, catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const camp = await Campground.findByIdAndDelete(id);
        res.redirect('/campgrounds');
    })
);

module.exports = router;