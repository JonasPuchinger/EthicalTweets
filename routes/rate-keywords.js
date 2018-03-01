var express = require('express');
var router = express.Router();
var assert = require('assert');

var mongo = require('mongodb').MongoClient;
var uid;
var url = 'mongodb://infophil:ethtweets8897@ethicaltweets-shard-00-00-nzg80.mongodb.net:27017,ethicaltweets-shard-00-01-nzg80.mongodb.net:27017,ethicaltweets-shard-00-02-nzg80.mongodb.net:27017/test?ssl=true&replicaSet=ethicaltweets-shard-0&authSource=admin';
var currtweet={};
var item={};





router.get('/', function(req, res, next) {



    uid = req.cookies.uid;


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

        res.cookie('wordc',currtweet.word);
        res.cookie('suppcategory0',currtweet.category0);
        res.cookie('suppcategory1',currtweet.category1);
        res.cookie('suppcategory2',currtweet.category2);
        res.cookie('ratedcategory',currtweet.ratedcategory);



        console.log("values in cookies");

        res.render('rate-keywords', { title: 'Ethical Tweets', contenthtml:currtweet.word});
    }



});



router.post('/insert', function(req, res, next){

    uid = req.cookies.uid;
    var locount = parseInt(req.cookies.counter+1);
    res.cookie("counter",locount);

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
        db.collection('resultkeywords').insertOne(item, function (err, result) {
            assert.equal(null, err);
            console.log('result data inserted');
            client.close();
        });
    });
    if(req.cookies.counter=="11111111111111"){
        res.redirect('/');
    }
    res.redirect('/rate-keywords');
    console.log("get tweet");
});



module.exports = router;
