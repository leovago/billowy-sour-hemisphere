/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect        = require('chai').expect;
var MongoClient   = require('mongodb').MongoClient;
var ObjectId      = require('mongodb').ObjectId;
var mongoose      = require('mongoose');
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
  console.log("DB state: " + mongoose.connection.readyState);

  
  const Schema = mongoose.Schema;

  const bookSchema = new Schema({
    title: { type: String, required: true }
  });
  
  const commentSchema = new Schema({
    comment: { type: String, required: true },
    bookId: { type: String, required: true }
  });

  let Book = mongoose.model("Book", bookSchema);
  let Comment = mongoose.model("Comment", commentSchema);
  
  
  function findBook(title){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) { // connected
          Book.findOne({title:title }, function(err, bookFound){
            if (err) {
              console.error(err);
              resolve(false);
            }
            (bookFound) ? resolve(bookFound) : resolve(false);
          });
      }
    });
  }
  
  function saveNewBook(title) {
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) { // connected
        let currentDate = new Date();
        let bookModel = new Book({
          title:title
        });
        bookModel.save(function(err, bookSaved){
          if (err) return console.error(err);
          (bookSaved) ? resolve(bookSaved) : resolve(false);
        }); // new book created
      }
    });
  }
  
  function getBooks() {
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) {
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
        Book.aggregate([{'$project': {
                        'title': 1, 
                        '_id': { '$toString': '$_id' }
                      }
                    }, { '$lookup': {
                        'from': 'comments', 
                        'localField': '_id', 
                        'foreignField': 'bookId', 
                        'as': 'comments'
                      }
                    }, { '$project': {
                        'title': 1, 
                        'comments': 1, 
                        'commentcount': { '$size': '$comments' }
                      }
                    }, { '$project': {
                        'title': 1, 'commentcount': 1
                      }
                    }
                  ]).
        then(function (booksFound) {
          //console.log(booksFound);
          (booksFound) ? resolve(booksFound) : resolve(false);
        });
      }
    });
  }
  
  function getBookById(bookId) {
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) {
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
        Book.aggregate([
          {
            '$project': {
              'title': 1, 
              '_id': {
                '$toString': '$_id'
              }
            }
          }, {
            '$match': {
              '_id': bookId
            }
          }, {
            '$lookup': {
              'from': 'comments', 
              'localField': '_id', 
              'foreignField': 'bookId', 
              'as': 'comments'
            }
          }, {
            '$project': {
              'title': 1, 
              'comments': 1, 
              'commentcount': {
                '$size': '$comments'
              }
            }
          }, {
            '$project': {
              'title': 1, 
              'comments.comment': 1
            }
          }
        ]).
        then(function (bookFound) {
          //console.log(bookFound);
          (bookFound) ? resolve(bookFound) : resolve(false);
        });
      }
    });
  }
  
  

  function saveNewComment(bookId, comment) {
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) {
        let commentModel = new Comment({
          comment:comment,
          bookId:bookId
        });
        commentModel.save(function(err, commentSaved){
          if (err) return console.error(err);
          (commentSaved) ? resolve(commentSaved) : resolve(false);
        }); // new comment saved
      }
    });
  }
  
  
  // developer
  app.get("/developer", function (req, res) {
    res.json({
      "developer":"Leo Vargas",
      "company":"Magno Technologies"
    });
  }); 

  
  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      let getBooksPromise = getBooks()
          .then(books => {
            //console.log(books);
            if (books) {
              res.json(books);
            } else {
              res.json('no books found');
            }
          });
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //console.log(`Title: ${title}`);
    
      if (req.body.title.length == 0) {
        res.json("no book exists");
        return null;
      }
    
      //check if exists
      let findBookPromise = findBook(title)
	        .then(found => {
            if (found) {
              res.json({
                title:found.title,
                _id:found._id
              });
            } else {
              let saveBookPromise = saveNewBook(title)
                .then(saved => {
                  res.json({
                    title:saved.title,
                    _id:saved.id
                  });
                });
            }
	        });
      //response will contain new book object including atleast _id and title
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      console.log("deleting");
      Book.deleteMany({})
        .then(deleted => {
          console.log('deleted');
          console.log(deleted);
          res.json('complete delete successful');
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookId = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      let getBookByIdPromise = getBookById(bookId)
          .then(book => {
            //console.log(book);
            if (book.length > 0) {
              res.json(book);
            } else {
              res.json('no book exists');
            }
          });
    })
    
    .post(function(req, res){
      var bookId = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get

      if (bookId.length == 0 || comment.length == 0) {
        res.json("no book exists or comment length is 0");
        return null;
      }
    
      let saveCommentPromise = saveNewComment(bookId, comment)
        .then(saved => {
          //pendiente
          let getBookByIdPromise = getBookById(bookId)
              .then(book => {
                if (book) {
                  res.json(book);
                }
              });
        });
    })
    
    .delete(function(req, res){
      var bookId = req.params.id;
      //if successful response will be 'delete successful'
      console.log(bookId);
      if (mongoose.connection.readyState == 1) { // connected
        if (req.params.id != undefined) {
          console.log('delete 2');
          //var bookObjectId = mongoose.Types.ObjectId(bookId);
          //let bookObjectId = 'no se';
          console.log(bookId);
          Book.deleteOne({ _id:bookId }, function(err){
            console.log("temp");
            if (err){
              console.error(err);
              res.json('could not delete ' + bookId);
            } else {
              res.json('delete successful');
            }
          });
        } else {
          res.json("_id error");
        }
      }
  
  
  
  
  });
  
};
