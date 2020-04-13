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
    res.render('pages/searches/show');
});

app.post('/searches' , (req , res)=>{
    let searchKEYword = req.body.searched ; 
    let filterApply = req.body.searchFilter;

    let bookApiURL = `https://www.googleapis.com/books/v1/volumes?q=${searchKEYword}+in${filterApply}`

    superagent.get(bookApiURL).then((resApi)=>{
        let dataBook = resApi.body.items;

        let book = dataBook.map(item =>{
            return new Book(item.volumeInfo);
        })
        res.render('pages/searches/show', {book:book})
    }).catch((err)=> errorHand(err , req , res))
})

app.use('*', (req,res)=>{
    res.status(404).send('Page NOT Found');
});


function Book(bookData){
    this.title = (bookData.title)? bookData.title : 'Unknown Book Title';
    this.author = (bookData.authors)? bookData.authors : 'Unknown Book Authors';
    this.description = (bookData.description)? bookData.description : 'Description Not Available';
    this.imageThum = (bookData.imageLinks.thumbnail)? bookData.imageLinks.thumbnail : 'https://i7.uihere.com/icons/829/139/596/thumbnail-caefd2ba7467a68807121ca84628f1eb.png';

}


function errorHand(error , req ,res ){
    res.status(500).send(error);
}

app.listen(PORT, () => console.log(`up and running on PORT ${PORT}`));