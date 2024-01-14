const express=require("express");
const app=express();
const path=require("path");
const puppeteer = require('puppeteer');
const hbs=require("hbs");
const mongoose=require("mongoose");
const { User, Movie } = require("./db/conn");
const bcrypt = require('bcryptjs');
const session = require('express-session');




mongoose.connect('mongodb://localhost:27017/CineInsightRegistration');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port= process.env.PORT|| 3000;
const static_path=path.join(__dirname,"../public");
const templates_path=path.join(__dirname,"../templates");
const partials_path=path.join(__dirname,"../templates/partials");
const views_path=path.join(__dirname,"../views");
console.log(static_path);
app.use(express.static(static_path));

app.set("view engine","hbs");
app.set("views",views_path);
hbs.registerPartials(partials_path);
app.use(express.static(views_path));
app.use(session({
    secret: 'Himani@123', 
    resave: false,
    saveUninitialized: false,
}));
app.get("/",(req,res)=>{
    res.render("index");
});
app.get("/login",(req,res)=>{
    res.render("login");
});
app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up Page' }); 
});
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login Page' }); 
});






app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        
        const newUser = new User({ username, email, password});
        await newUser.save();
        req.session.user=newUser;
        console.log(req.session.user);
        res.redirect(`/home?username=${newUser.username}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});


app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user && password === user.password) {
            req.session.user = user;
            console.log(req.session.user);
            res.redirect(`/home?username=${username}`);
        } else {
            res.redirect('/');
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/home', async (req, res) => {
    try {
        console.log(req.session.user);
        const allMovies = await Movie.find().limit(200);
        
        res.render('home', { user: req.session.user, movies: allMovies });
    } catch (error) {
        console.error('Error fetching movies:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/search', async (req, res) => {
    try {
        const { query } = req.query;

        const movies = await Movie.find({ title: { $regex: new RegExp(query, 'i') } });

        res.render('search', { user: req.user, query, movies });
    } catch (error) {
        console.error('Error searching movies:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/loadMovies', async (req, res) => {
    try {
        const { page } = req.query;
        const itemsPerPage=200; 
        const skip = (page - 1) * itemsPerPage;

        const movies = await Movie.find().skip(skip).limit(itemsPerPage);

        res.json(movies);
    } catch (error) {
        console.error('Error loading additional movies:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/filter', async (req, res) => {
    try {
        
        const { rating, genres, platforms, language } = req.body;

        const filterCriteria = {};

        if (rating) {
            filterCriteria.rating = { $gte: parseFloat(rating) };
        }

        if (genres) {
            filterCriteria.genres = { $regex: new RegExp(genres, 'i') };
        }

        if (platforms &&  platforms.length > 0) {
            filterCriteria.platforms = { $in: platforms };
            console.log(filterCriteria.platforms);
        }

        if (language) {
            filterCriteria.language = { $regex: new RegExp(language, 'i') };
        }

        const movies = await Movie.find({
            $and: [filterCriteria] 
        });

        res.render('filter', { user: req.user, rating, genres, platforms,language, movies });
    } catch (error) {
        console.error('Error applying filter:', error.message);
        res.status(500).send('Internal Server Error');
    }
});




app.get('/movie/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        console.log('Movie ID:', movieId); 
        const movie = await Movie.findById(movieId);
        console.log('Fetched Movie:', movie); 
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        
        
        res.render('movie', { movie });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




app.get('/profile/:username', async (req, res) => {
    try {
        const requestedUsername = req.params.username;
        const userProfile = await User.findOne({ username: requestedUsername });

        if (!userProfile) {
            return res.status(404).send('User not found');
        }

        res.render('profile', { userProfile });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.listen(port,()=>{
    console.log("prog is running on port 3000")
});