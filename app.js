const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

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

app.listen(3000, () => {
    console.log('Server live on port 3000');
})