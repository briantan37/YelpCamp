if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const morgan = require('morgan');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {cspConfig} = require('./csp');
const ExpressError = require('./utils/ExpressError');
const User = require('./models/user');

const MongoStore = require('connect-mongo')(session);

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const dbURL = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
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

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

app.use(morgan('tiny'));

const store = new MongoStore({
    url: dbURL,
    secret: 'Zd2tGB!16QweAAA32=u6pBAzcBdIGM7NZPy^^+-*jz^OLIB7c',
    touchAfter: 24 * 3600,
})

store.on('error', function(e) => {
    console.log("Session Store Error");
});

const sessionConfig = {
    store,
    name: '__session',
    secret: 'Zd2tGB!16QweAAA32=u6pBAzcBdIGM7NZPy^^+-*jz^OLIB7c',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

app.use(helmet.contentSecurityPolicy({directives: {...cspConfig}}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { status = '500' } = err;
    if (!err.message) err.message = 'Something went wrong';
    res.status(status).render('error', { err });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server live on port ${port}`);
});
