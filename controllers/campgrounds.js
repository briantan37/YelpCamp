const Campground = require('../models/campground');

module.exports.index = async (req, res) => {
    const allCamps = await Campground.find({});
    res.render('campgrounds/index', { allCamps });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    const camp = new Campground(req.body.campground);
    camp.author = req.user._id;
    camp.images = req.files.map(f => ({url: f.path, filename: f.filename}));
    await camp.save();
    req.flash('success', 'Successfully made a new campground');
    res.redirect(`/campgrounds/${camp._id}`);
}

module.exports.showCampground = async (req, res, next) => {
    const camp = await (await Campground.findById(req.params.id).populate({
        path:'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author'));
    if(!camp) {
        req.flash('error', 'Campground not found!');
        res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { camp });
}

module.exports.renderEditForm = async (req, res, next) => {
    const camp = await Campground.findById(req.params.id);
    if(!camp) {
        req.flash('error', 'Campground not found!');
        res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { camp });
}

module.exports.updateCampground = async (req, res, next) => {
    const { id } = req.params;
    console.log(req.body);
    const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    camp.images.push(...imgs);
    await camp.save();
    req.flash('success', 'Successfully updated campground!');
    //console.log(`Update camp to the database : ${camp}`);
    res.redirect(`/campgrounds/${camp._id}`);
}

module.exports.deleteCampground = async (req, res, next) => {
    const { id } = req.params;
    const camp = await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}