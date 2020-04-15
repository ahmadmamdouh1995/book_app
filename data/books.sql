  
DROP TABLE IF EXISTS book;

CREATE TABLE book(
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  author VARCHAR(255),
  isbn VARCHAR(255),
  image_url VARCHAR(65535),
  description TEXT,
  bookshelf VARCHAR(255)
);

CREATE TABLE bookshelvesTable(
    id SERIAL PRIMARY KEY,
    bookshelfName VARCHAR(255)
)
