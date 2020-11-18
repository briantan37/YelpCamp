const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const Campground = require('./models/campground');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Database connection established');
});

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/campgrounds', async (req, res) => {
    const allCamps = await Campground.find({});
    //console.log(allCamps);
    res.render('campgrounds/index', {allCamps});
});

app.get('/campgrounds/:id', async (req, res) => {
    const camp = await Campground.findById(req.params.id);
    //console.log(camp);
    res.render('campgrounds/show', {camp});
});

app.get('/makecampground', async (req, res) => {
    const camp = new Campground({title: 'Yosemite', price: '$200', description: 'Camp at Yosemite!', location: 'Yosemite, CA'});
    await camp.save();
    res.send(camp);
});


app.listen(3000, () => {
    console.log('Server live on port 3000');
})