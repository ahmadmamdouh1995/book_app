'use stric';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const cors =require('cors');
const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());

app.set('view engine', 'ejs');

app.use(express.static('./public/styles'));
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.render('pages/index');
});

app.get('/searches/new', (req,res)=>{
    res.render('pages/searches/new');
});

app.use('*', (req,res)=>{
    res.status(404).send('Page NOT Found');
});

app.listen(PORT, () => console.log(`up and running on PORT ${PORT}`));