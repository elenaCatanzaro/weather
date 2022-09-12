if( process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const MongoClient = require('mongodb').MongoClient;
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const LocalStrategy = require('passport-local');
const SimpleLinearRegression = require('ml-regression-simple-linear');

const API_KEY =  '';
const port = process.env.PORT || 8080;
const dbUrl = 'mongodb://localhost:27017';
const client = new MongoClient(dbUrl);
const dbName = 'weather';
var ObjectId = require('mongodb').ObjectID;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));
app.use(express.urlencoded({extended:false}));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET ,
    resave: false, 
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));


const authenticateUser = async (email, password, done)=>{
    const user = await getUserByEmail(email);
    if( user == null ){
        return done(null, false, {message: 'No user with that email'});
    }
    try{
        console.log("utente: " + user );
        if( user.password == password ){
            return done(null,user);
        } else {
            return done(null,false, {message:'password incorretct'});
        }
    }catch(e){
        return done(e);
    }
}

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password'}, authenticateUser))
passport.serializeUser((user,done) => {
    done(null, user._id)});
passport.deserializeUser( async (id,done)=> {
    ut = await getUserById(id);
    return done(null,await getUserById(id));
});

async function getUserByEmail( email ){
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('user');
    let user = await collection.findOne({email:email});
    client.close();
    return user;
}

async function getUserById( id ){
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('user');
    let user = await collection.findOne({_id: new ObjectId(id)});
    client.close();
    return user;
}


app.get('/w', checkNotAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, 'views/weather.html'));
});

app.get('/w/cities', function (req, res){
    res.sendFile(path.join(__dirname, 'views/citiesList.html'));
});

app.get('/dashboard', checkAuthenticated, function (req,res){
    res.render( 'dashboard.ejs');
});

app.get('/w/city/:name', async function(req,res){
    weekday = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
    months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
    now = new Date();
    let name = req.params.name;
    let data = await getWeather(name);
    if( JSON.stringify(data) == JSON.stringify({})){
        console.log("non trovata");
        res.sendFile(path.join(__dirname, 'views/error.html'));
    } else {
        console.log("trovata");
        data.date = weekday[now.getDay()] +' '+ now.getDate() + ' ' + months[now.getMonth()];
        res.render('city.ejs',data);    
    }
    
});

app.get('/w/uselog/city/:name', checkAuthenticated, async function(req,res){
    weekday = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
    months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
    now = new Date();
    let name = req.params.name;
    let data = await getWeather(name);
    if( JSON.stringify(data) == JSON.stringify({})){
        console.log("non trovata");
        res.sendFile(path.join(__dirname, 'views/error.html'));
    } else {
        console.log("trovata");
        data.date = weekday[now.getDay()] +' '+ now.getDate() + ' ' + months[now.getMonth()];
        res.render('cityLog.ejs',data);    
    }
    
});

app.get('/w/login', checkNotAuthenticated, function(req,res){
    res.render('login.ejs');
});

app.post('/w/login', checkNotAuthenticated, passport.authenticate('local',{
    successRedirect: '/dashboard',
    failureRedirect: '/w/login',
    failureFlash: true 
}))

app.get('/w/register',checkNotAuthenticated, function(req,res){
    res.render('register.ejs', {});
});

app.post('/w/register', checkNotAuthenticated, async( req,res) =>{
    
    try{
        if( req.body.password.length < 8 ){
            res.render('register.ejs', {error: "Passowrd must be at least 8 characters long", email: req.body.email, password: req.body.password, password2: req.body.password2});
        } else if( req.body.password != req.body.password2 ){
            res.render('register.ejs', {error: "Passwords don't match", email: req.body.email, password: req.body.password, password2: req.body.password2 });;
        } else {
            await client.connect();
            const db = client.db(dbName);
            const collection = db.collection('user');
            user = await collection.findOne({email:req.body.email});
            if( user != null ){
                res.render('register.ejs', {error: "Email already used", email: req.body.email, password: req.body.password, password2: req.body.password2 });
            } else {
                await collection.insertOne({email: req.body.email, password: req.body.password});
                client.close();
                res.redirect('/w/login');
            }
            
        }
    } catch (e){
        console.log(e);
        res.redirect('/w/register');
    }
})

app.delete('/logout', (req,res)=>{
    req.logout( function(err) {
        if(err) { return next(err); }
        res.redirect('/w/login');
    });
});

//api
app.get('/w/comp/:suf', async function(req,res){
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('city');
    let cities = await collection.find({city: { $regex: '^'+req.params.suf, $options: 'i' }}).project({city:1, country:1}).toArray();
    client.close();
    res.send(cities);
});

app.get('/user/cities', checkAuthenticated, async function(req,res){
    let cities = req.user.cities;
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('city');
    
    city_id = []
    if( cities == null || cities == undefined ){
        res.send([]);
    } else {
        for( i = 0; i<cities.length; i++ ){
            city_id.push(new ObjectId(cities[i]));
        }   
        
        let cod = await collection.find({_id: {$in: city_id }}).toArray();
        client.close();
        let weather = [];
        
        for( i= 0; i<cod.length; i++ ){
            let url = `https://api.openweathermap.org/data/2.5/weather?lat=${cod[i].lat}&lon=${cod[i].lng}&units=metric&appid=${API_KEY}`;
            
            let response = await axios.get(url);
            weather.push({ city: cod[i].city, _id: cod[i]._id, weather: response.data.weather[0].main, temp: Math.round(response.data.main.temp), icon: getIcon(response.data.weather[0].id) });
        }

        res.send(weather);
    }    
});

app.get('/weather/:city', checkAuthenticated, async function(req,res){
    let user = req.user._id;
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('city');
    let par = await collection.findOne({_id: new ObjectId(req.params.city)});
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${par.lat}&lon=${par.lng}&units=metric&appid=${API_KEY}`;
    let response = await axios.get(url);
    res.send({ city: par.city, _id: par._id, weather: response.data.weather[0].main, temp: Math.round(response.data.main.temp), icon: getIcon(response.data.weather[0].id)});
});

app.post('/user/add/:city', checkAuthenticated, async function(req,res){
    let user = req.user._id;
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('user');
    await collection.updateOne({_id: new ObjectId(user)}, {$push: {cities: new ObjectId(req.params.city)}});
    client.close()
});

app.delete('/user/delete/:city', checkAuthenticated, async function(req,res){
    let user = req.user._id;

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('user');
    await collection.updateOne({_id : new ObjectId(user)}, {$pull: {cities: new ObjectId(req.params.city)}});
    client.close();

    let updated = await getUserById(user);
    res.send(updated);
});

app.post('/suggest/:city', function(req,res){
    console.log("got the city" +  req.params.city);
    res.send("done server");
});


function checkAuthenticated(req,res,next){
    if( req.isAuthenticated() ){
        return next();
    } 
    res.redirect('/w/login');
}

function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect('/dashboard');
    }
    next();
}

async function getWeather( name ){
    try{
        let url = `http://api.openweathermap.org/geo/1.0/direct?q=${name.replace("_", " ")}&limit=1&appid=${API_KEY}`;
        let response = await axios.get(url);
        if( JSON.stringify( response.data) == JSON.stringify([])){
            console.log("udite udite è vuoto");
            return {};
        } else {
            response = response.data[0];
            let lat = response.lat;
            let lon = response.lon;
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${response.lat}&lon=${response.lon}&units=metric&appid=${API_KEY}`;
            response = await axios.get(url);
                let data = {
                city: capitalizeFirstLetter(name.replace("_", " ")),
                weather: response.data.weather[0].main,
                temperature: Math.round(response.data.main.temp),
                humidity: response.data.main.humidity,
                wind: response.data.wind.speed,
                pressure: response.data.main.pressure,
                icon: getIcon( response.data.weather[0].id),
            };
            url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=2&key=ca16a694c3954ee69409f0e931aa76c4&`;
            let forecast = await axios.get(url);
            let next_temp = Math.round(forecast.data.data[1].temp);
            data.next_temp = next_temp;
            data.next_desc = forecast.data.data[1].weather.description;
            data.next_icon = getIcon(forecast.data.data[0].weather.code);
            return data;    
        }
        
    }catch(error) {
        console.log(error);
    }
}

function capitalizeFirstLetter( word ){
    return word.charAt(0).toUpperCase() + word.slice(1);
}

app.listen(port);
console.log('Server started at http://localhost:' + port);

const icons = {
    thunder_storm : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-lightning-rain" viewBox="0 0 16 16">
  <path d="M2.658 11.026a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm9.5 0a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm-7.5 1.5a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm9.5 0a.5.5 0 0 1 .316.632l-.5 1.5a.5.5 0 1 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.316zm-.753-8.499a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 10H13a3 3 0 0 0 .405-5.973zM8.5 1a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 1zM7.053 11.276A.5.5 0 0 1 7.5 11h1a.5.5 0 0 1 .474.658l-.28.842H9.5a.5.5 0 0 1 .39.812l-2 2.5a.5.5 0 0 1-.875-.433L7.36 14H6.5a.5.5 0 0 1-.447-.724l1-2z"/>
</svg>`,
    rain: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-rain" viewBox="0 0 16 16">
  <path d="M4.158 12.025a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm3 0a.5.5 0 0 1 .316.633l-1 3a.5.5 0 0 1-.948-.316l1-3a.5.5 0 0 1 .632-.317zm3 0a.5.5 0 0 1 .316.633l-.5 1.5a.5.5 0 0 1-.948-.316l.5-1.5a.5.5 0 0 1 .632-.317zm3 0a.5.5 0 0 1 .316.633l-1 3a.5.5 0 1 1-.948-.316l1-3a.5.5 0 0 1 .632-.317zm.247-6.998a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 11H13a3 3 0 0 0 .405-5.973zM8.5 2a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1 0 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 2z"/>
</svg>`,
    snow: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-snow2" viewBox="0 0 16 16">
  <path d="M8 16a.5.5 0 0 1-.5-.5v-1.293l-.646.647a.5.5 0 0 1-.707-.708L7.5 12.793v-1.086l-.646.647a.5.5 0 0 1-.707-.708L7.5 10.293V8.866l-1.236.713-.495 1.85a.5.5 0 1 1-.966-.26l.237-.882-.94.542-.496 1.85a.5.5 0 1 1-.966-.26l.237-.882-1.12.646a.5.5 0 0 1-.5-.866l1.12-.646-.884-.237a.5.5 0 1 1 .26-.966l1.848.495.94-.542-.882-.237a.5.5 0 1 1 .258-.966l1.85.495L7 8l-1.236-.713-1.849.495a.5.5 0 1 1-.258-.966l.883-.237-.94-.542-1.85.495a.5.5 0 0 1-.258-.966l.883-.237-1.12-.646a.5.5 0 1 1 .5-.866l1.12.646-.237-.883a.5.5 0 0 1 .966-.258l.495 1.849.94.542-.236-.883a.5.5 0 0 1 .966-.258l.495 1.849 1.236.713V5.707L6.147 4.354a.5.5 0 1 1 .707-.708l.646.647V3.207L6.147 1.854a.5.5 0 1 1 .707-.708l.646.647V.5a.5.5 0 0 1 1 0v1.293l.647-.647a.5.5 0 1 1 .707.708L8.5 3.207v1.086l.647-.647a.5.5 0 1 1 .707.708L8.5 5.707v1.427l1.236-.713.495-1.85a.5.5 0 1 1 .966.26l-.236.882.94-.542.495-1.85a.5.5 0 1 1 .966.26l-.236.882 1.12-.646a.5.5 0 0 1 .5.866l-1.12.646.883.237a.5.5 0 1 1-.26.966l-1.848-.495-.94.542.883.237a.5.5 0 1 1-.26.966l-1.848-.495L9 8l1.236.713 1.849-.495a.5.5 0 0 1 .259.966l-.883.237.94.542 1.849-.495a.5.5 0 0 1 .259.966l-.883.237 1.12.646a.5.5 0 0 1-.5.866l-1.12-.646.236.883a.5.5 0 1 1-.966.258l-.495-1.849-.94-.542.236.883a.5.5 0 0 1-.966.258L9.736 9.58 8.5 8.866v1.427l1.354 1.353a.5.5 0 0 1-.707.708l-.647-.647v1.086l1.354 1.353a.5.5 0 0 1-.707.708l-.647-.647V15.5a.5.5 0 0 1-.5.5z"/>
</svg>`,
    fog: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-fog2" viewBox="0 0 16 16">
  <path d="M8.5 4a4.002 4.002 0 0 0-3.8 2.745.5.5 0 1 1-.949-.313 5.002 5.002 0 0 1 9.654.595A3 3 0 0 1 13 13H.5a.5.5 0 0 1 0-1H13a2 2 0 0 0 .001-4h-.026a.5.5 0 0 1-.5-.445A4 4 0 0 0 8.5 4zM0 8.5A.5.5 0 0 1 .5 8h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/>
</svg>`,
    cloudy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-sun" viewBox="0 0 16 16">
  <path d="M7 8a3.5 3.5 0 0 1 3.5 3.555.5.5 0 0 0 .624.492A1.503 1.503 0 0 1 13 13.5a1.5 1.5 0 0 1-1.5 1.5H3a2 2 0 1 1 .1-3.998.5.5 0 0 0 .51-.375A3.502 3.502 0 0 1 7 8zm4.473 3a4.5 4.5 0 0 0-8.72-.99A3 3 0 0 0 3 16h8.5a2.5 2.5 0 0 0 0-5h-.027z"/>
  <path d="M10.5 1.5a.5.5 0 0 0-1 0v1a.5.5 0 0 0 1 0v-1zm3.743 1.964a.5.5 0 1 0-.707-.707l-.708.707a.5.5 0 0 0 .708.708l.707-.708zm-7.779-.707a.5.5 0 0 0-.707.707l.707.708a.5.5 0 1 0 .708-.708l-.708-.707zm1.734 3.374a2 2 0 1 1 3.296 2.198c.199.281.372.582.516.898a3 3 0 1 0-4.84-3.225c.352.011.696.055 1.028.129zm4.484 4.074c.6.215 1.125.59 1.522 1.072a.5.5 0 0 0 .039-.742l-.707-.707a.5.5 0 0 0-.854.377zM14.5 6.5a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z"/>
</svg>`,
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sun" viewBox="0 0 16 16">
  <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
</svg>`,
}

function getIcon( weather_code ){
    weather_code = String(weather_code);
    switch( weather_code.charAt(0)){
        case '2':
            return icons["thunder_storm"];
        case '3':
            return icons["rain"];
        case '5': 
            return icons["rain"];
        case '6':
            return icons["snow"];
        case '7':
            return icons["fog"];
        case '8':
            if( weather_code.charAt(2) == '0')
                return icons["sun"];
            else 
                return icons["cloudy"];
        defualt:
            return "no-icon";
    }
}