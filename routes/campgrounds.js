const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const { campgroundSchema } = require('../schemas');

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

router.get(
    '/',
    catchAsync(async (req, res, next) => {
        const allCamps = await Campground.find({});
        //console.log(allCamps);
        res.render('campgrounds/index', { allCamps });
    })
);

router.get('/new', (req, res) => {
    res.render('campgrounds/new');
});

router.post(
    '/',
    validateCampground,
    catchAsync(async (req, res, next) => {
        //if (!req.body.campground) throw new ExpressError("Invalid Campground Data", 400);
        const camp = new Campground(req.body.campground);
        await camp.save();
        //console.log(`Inserted camp to the database : ${camp}`);
        res.redirect(`/campgrounds/${camp._id}`);
    })
);

router.get(
    '/:id',
    catchAsync(async (req, res, next) => {
        const camp = await Campground.findById(req.params.id).populate('reviews');
        //console.log(camp);
        res.render('campgrounds/show', { camp });
    })
);

router.get(
    '/:id/edit',
    catchAsync(async (req, res, next) => {
        const camp = await Campground.findById(req.params.id);
        res.render('campgrounds/edit', { camp });
    })
);

router.put(
    '/:id',
    validateCampground,
    catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
        //console.log(`Update camp to the database : ${camp}`);
        res.redirect(`/campgrounds/${camp._id}`);
    })
);

router.delete(
    '/:id',
    catchAsync(async (req, res, next) => {
        const { id } = req.params;
        const camp = await Campground.findByIdAndDelete(id);
        res.redirect('/campgrounds');
    })
);

module.exports = router;