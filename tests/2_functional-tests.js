/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  test('#example Test GET /api/books', function(done){
     chai.request(server)
      .get('/api/books')
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  });
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function() {
    var testId = '';

    suite('POST /api/books with title => create book object/expect book object', function() {
      
      test('Test POST /api/books with title', function(done) {
        chai.request(server)
          .post('/api/books')
          .send({
            title:'Back End Development'
          })
          .end(function(err, res){
            //console.log("this is the response");
            //console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body.title, 'Back End Development', `Expected 'Title, Recived: ${res.body.title}'`);
            assert.match(res.body._id.toString(), /^([a-f]|[0-9]){24}/, "_id"); // _id hex: 5e1f76abaee15426aa457e5c 
            testId = res.body._id;          
            done();
        });
      });
      
      test('Test POST /api/books with no title given', function(done) {
        chai.request(server)
          .post('/api/books')
          .send({
            title:''
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body, 'no book exists');
            done();
        });
        
      });
      
    });


    suite('GET /api/books => array of books', function(){
      
      test('Test GET /api/books',  function(done){
       chai.request(server)
        .get('/api/books')
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body, 'response should be an array');
          assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
          assert.property(res.body[0], 'title', 'Books in array should contain title');
          assert.property(res.body[0], '_id', 'Books in array should contain _id');
          done();
        });
      });      
      
    });


    suite('GET /api/books/[id] => book object with [id]', function(){
      
      test('Test GET /api/books/[id] with id not in db',  function(done){
        chai.request(server)
          .get('/api/books/5e6140ea1534e54b03b23c34')
          .end(function(err, res){
            //console.log(res.body);
            assert.equal(res.status, 200);
            assert.equal(res.body, 'no book exists');
            done();
          });
        
      });
      
      test('Test GET /api/books/[id] with valid id in db',  function(done){
         chai.request(server)
          .get('/api/books/' + testId)
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body[0]._id.toString(), testId);
            done();
          });
      });
    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      test('Test POST /api/books/[id] with comment', function(done){
        var tempComment = 'This is a test comment' + Math.floor(Math.random() * 1001);
        chai.request(server)
          .post('/api/books/' + testId)
          .send({
            comment:tempComment
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body[0]._id.toString(), testId);
            assert.equal(res.body[0].comments[res.body[0].comments.length - 1].comment, tempComment);
            done();
        });
      });
      
    });

  });

});
