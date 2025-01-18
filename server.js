require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const morgan = require('morgan');
const NodeCache = require('node-cache');
const axios = require('axios');

const app = express();
const PORT = 3000;
const cache = new NodeCache();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/fullstackApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model('users', userSchema);


app.get('/', (req, res) => {
    res.render('index');
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('All fields are required!');
    }

    if (password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters long!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.render('success', { name });
});

app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.get('/api/weather', async (req, res) => {
    const cachedData = cache.get('weather');

    if (cachedData) {
        return res.json(cachedData);
    }

    try {
        const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=0f9ea678f964950cc008f200d45fe133`);

        cache.set('weather', data, 3600);
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching weather data');
    }
});

app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
