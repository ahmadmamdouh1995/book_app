'use strict';

let bookshelves = [];

require('dotenv').config();
const PORT = process.env.PORT || 4000;
const express = require('express');
const superagent = require('superagent');
const methodOverRide = require('method-override');
const pg = require('pg');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverRide('_method'));
app.use('/public', express.static('public'));

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (error) => console.log(error));

app.get('/', gettingSavedBooks);
app.get('/hello', getIndex);
app.get('/searches/new', getNew);
app.post('/searches', getSearch);
app.get('/books/:id', getDetail);
app.post('/books', SQLshow);
app.put('/books/:id', updateBooks);
app.delete('/books/:id', deleteBooks);
app.use('*', notFoundError);


function gettingSavedBooks(req, res) {
    const SQL = 'SELECT * FROM book;'
    return client.query(SQL).then((savedBooks) => res.render('pages/index', { books: savedBooks.rows }))
}
//////////////////////////////////////////
function getIndex(req, res) {
    return res.render('pages/index');
};
///////////////////////////////////////////////////
function getNew(req, res) {
    return res.render('pages/searches/new');
};
/////////////////////////////////////////////

function getSearch(req, res) {
    let searchKeyword = req.body.searched;
    let filterApplied = req.body.searchFilter;
    let bookAPIurl = `https://www.googleapis.com/books/v1/volumes?q=${searchKeyword}+in${filterApplied}`
    superagent.get(bookAPIurl).then((apiRes) => {
        let bookData = apiRes.body.items;
        let book = bookData.map(item => {
            return new Book(item.volumeInfo);
        })
        res.render('./pages/searches/show', { book: book });
    }).catch((err) => errorHandler(err, req, res))
};
//////////////////////////////////////////////////////////

function getDetail(req, res) {
    const SQL = 'SELECT * FROM book WHERE id=$1;'
    const values = [req.params.id];
    return client.query(SQL, values).then((bookDetails) => {
        res.render('pages/books/detail', { book: bookDetails.rows[0] });
    }).catch((error) => {
        errorHandler(error, req, res);
    });
};
//////////////////////////////////////////////
function SQLshow(req, res) {
    //replace search title with isbn
    const sqlSearch = 'SELECT (title, author, image_url, description, isbn) FROM book WHERE $1=title AND $2=author AND $3=image_url AND $4=description AND $5=isbn;'
    const searchVal = [req.body.bookTitle, req.body.bookAuthor, req.body.bookImage, req.body.bookDescription, req.body.bookISBN];
    client.query(sqlSearch, searchVal).then((searchedResult) => {
        if (searchedResult.rows.length > 0) {
            res.render('pages/books/show', { book: searchVal });
        } else {
            const SQL = 'INSERT INTO book (title, author, image_url, description, isbn) VALUES ($1,$2,$3, $4, $5);'
            const values = [req.body.bookTitle, req.body.bookAuthor, req.body.bookImage, req.body.bookDescription, req.body.bookISBN];
            client.query(SQL, values).then((addedBook) => {
                res.render('pages/books/show', { book: values });
            }).catch((err) => {
                errorHandler(err, req, res);
            });
        }
    })
};
///////////////////////////////////////////////////

function updateBooks(req, res) {
    if (req.body.addBookShelf) {
        if (!(bookshelves.includes(req.body.addBookShelf))) {
            bookshelves.push(req.body.addBookShelf)
        }

        const upSQl = 'UPDATE book SET title=$1, author=$2, image_url=$3, description=$4, isbn=$5, bookshelf=$6 WHERE id=$7 ';
        const upValue = [req.body.bookTitle, req.body.bookAuthor, req.body.bookImage, req.body.bookDescription, req.body.bookISBN, req.params.id];
        client.query(upSQl, upValue).then((upResult) => {
            res.redirect(`/books/${req.params.id}`)
        }).catch((error) => errorHandler(error, req, res));
    } else {
        const upSQl = 'UPDATE book SET title=$1, author=$2, image_url=$3, description=$4, isbn=$5 WHERE id=$6 ';
        const upValue = [req.body.bookTitle, req.body.bookAuthor, req.body.bookImage, req.body.bookDescription, req.body.bookISBN, req.params.id];
        client.query(upSQl, upValue).then((upResult) => {
            res.redirect(`/books/${req.params.id}`)
        }).catch((error) => errorHandler(error, req, res));

    }


};
////////////////////////////////////////////////////

function deleteBooks(req, res) {
    const deleteSQL = 'DELETE FROM book WHERE id=$1';
    const deleteVAL = [req.params.id];
    client.query(deleteSQL, deleteVAL).then((deleteResult) => {
        res.redirect('/');
    }).catch((error) => errorHandler(error, req, res));
};

/////////////////////////////////////////////////

client.connect().then(() => {
    app.listen(PORT, () => console.log(`The server is Up & running on PORT ${PORT}`));
});


function Book(bookData) {
    this.title = (bookData.title) ? bookData.title : 'Unknown Book Title';
    this.author = (bookData.authors) ? bookData.authors : 'Unknown Book Authors';
    this.description = (bookData.description) ? bookData.description : 'Description not available';
    this.imageThum = (bookData.imageLinks.thumbnail) ? bookData.imageLinks.thumbnail : 'https://i7.uihere.com/icons/829/139/596/thumbnail-caefd2ba7467a68807121ca84628f1eb.png';
    this.isbn = (bookData.industryIdentifiers[0].identifier);
}

//helpers
function errorHandler(err, req, res) {
    res.status(500).render('pages/error', { error: err });
};

function notFoundError(req, res) {
    return res.status(404).send('Page not found');
};

