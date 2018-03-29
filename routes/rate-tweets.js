var express = require('express');
var router = express.Router();
var assert = require('assert');

var mongo = require('mongodb').MongoClient;
var uid;
var url = 'mongodb://infophil:ethtweets8897@ethicaltweets-shard-00-00-nzg80.mongodb.net:27017,ethicaltweets-shard-00-01-nzg80.mongodb.net:27017,ethicaltweets-shard-00-02-nzg80.mongodb.net:27017/test?ssl=true&replicaSet=ethicaltweets-shard-0&authSource=admin';
var currtweet={};
var item={};



var start ="START";

router.get('/', function(req, res, next) {


  //setting id from cookie
  uid = req.cookies.uid;

    //connecting
    mongo.connect(url, function(err, client) {
        assert.equal(null, err);
        //setting empty content (text-field)
        start="";
        var db = client.db('users');
        var col = db.collection('tweets
        //get random tweet from db
        col.aggregate([{$sample: {size: 1}}])
            .each(function(err, doc) {
                if(doc) {
                    //setting currtweet to object
                    currtweet=doc;
                    console.log("tweet aus db geholt und ueberschrieben");
                    overwriteItem();
                }
                client.close();
                return false;
            });
    });
    function overwriteItem(){
        //set information from tweet needed as cookies

        res.cookie('wordc',currtweet.word);
        res.cookie('suppcategory0',currtweet.category0);
        res.cookie('suppcategory1',currtweet.category1);
        res.cookie('suppcategory2',currtweet.category2);
        res.cookie('ratedcategory',currtweet.ratedcategory);



        //render new textfield

        res.render('rate-tweets', { title: 'Ethical Tweets', contenthtml:currtweet.content, namehtml:currtweet.handle,
            datehtml:currtweet.date,starthtml:start});
    }



});

router.get('/get-tweet', function(req, res, next) {


});

router.post('/insert', function(req, res, next){


    uid = req.cookies.uid;
  //counter to 10
    var locount = parseInt(req.cookies.counter+1);
    res.cookie("counter",locount);
   //creating new object with user data input
    //storing user input data in cookies solves the problem that more than
    //one user is currently rating the tweets(app runs only one instance)


    item = {
        word: req.cookies.wordc,
        suppcategory0: parseInt(req.cookies.suppcategory0),
        suppcategory1: parseInt(req.cookies.suppcategory1),
        suppcategory2: parseInt(req.cookies.suppcategory2),
        ratedcategory: parseInt(req.body.kategorie),
        userid: uid
    };

    console.log("item mit werten aus cookie");
    mongo.connect(url, function (err, client) {
        assert.equal(null, err);
        var db = client.db('users');
      //callback and inserting
        db.collection('result').insertOne(item, function (err, result) {
            assert.equal(null, err);
            console.log('result data inserted');
            client.close();
        });
    });
  //if 10 tweets are rated redirecting to keywords
    if(req.cookies.counter=="111111111"){
        res.cookie("counter",0);
        res.redirect('/rate-keywords');
    }
  //else self-redirect
    res.redirect('/rate-tweets');
    console.log("get tweet");
});



module.exports = router;
