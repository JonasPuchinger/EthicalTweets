var express = require('express');
var router = express.Router();
var assert = require('assert');

var mongo = require('mongodb').MongoClient;
var uid;
var url = 'mongodb://infophil:ethtweets8897@ethicaltweets-shard-00-00-nzg80.mongodb.net:27017,ethicaltweets-shard-00-01-nzg80.mongodb.net:27017,ethicaltweets-shard-00-02-nzg80.mongodb.net:27017/test?ssl=true&replicaSet=ethicaltweets-shard-0&authSource=admin';
var currtweet={};
var item={};
console.log("leeres obj");

var start ="START";

router.get('/', function(req, res, next) {
  uid = req.cookies.uid;

  res.render('rate-tweets', { title: 'Ethical Tweets', contenthtml:currtweet.content, namehtml:currtweet.handle,
      datehtml:currtweet.date,starthtml:start});

});

router.get('/get-tweet', function(req, res, next) {
    mongo.connect(url, function(err, client) {
        assert.equal(null, err);
        start="";
        var db = client.db('users');
        var col = db.collection('tweets');
        col.aggregate([{$sample: {size: 1}}])
            .each(function(err, doc) {
                if(doc) {
                  currtweet=doc;
                    console.log("tweet aus db geholt und ueberschrieben");
                    overwriteItem();
                }
                    client.close();
                    return false;
                });
    });
    function overwriteItem(){
        console.log(currtweet);

        item = {
            word: currtweet.word,
            suppcategory0: currtweet.category0,
            suppcategory1: currtweet.category1,
            suppcategory2: currtweet.category2,
            ratedcategory: req.body.kategorie,
            userid: uid
        };
        console.log("item überschrieben");

        res.redirect('/rate-tweets');
    }

});

router.post('/insert', function(req, res, next){

    item.ratedcategory=parseInt(req.body.kategorie);
    console.log("kat überschrieben");
    mongo.connect(url, function (err, client) {
        assert.equal(null, err);
        var db = client.db('users');
        db.collection('result').insertOne(item, function (err, result) {
            assert.equal(null, err);
            console.log('result data inserted');
            client.close();
        });
    });
    res.redirect('/rate-tweets/get-tweet');
    console.log("get tweet");
});



module.exports = router;
