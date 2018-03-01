/**
 * Created by simon on 13.01.2018.
 */
var express = require('express');

var router = express.Router();
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var shortid = require('shortid');

var url = 'mongodb://infophil:ethtweets8897@ethicaltweets-shard-00-00-nzg80.mongodb.net:27017,ethicaltweets-shard-00-01-nzg80.mongodb.net:27017,ethicaltweets-shard-00-02-nzg80.mongodb.net:27017/test?ssl=true&replicaSet=ethicaltweets-shard-0&authSource=admin';

var userId;

router.get('/', function(req, res, next) {
    userId = shortid.generate();
    res.cookie('uid',userId);
    res.render('pre-rate-tweets', { title: 'Ethical Tweets' });

});

router.get('/get-data', function(req, res, next) {
    var resultArray = [];
    mongo.connect(url, function(err, client) {
        assert.equal(null, err);
        var db = client.db('users');
        var cursor = db.collection('users').find();
        cursor.forEach(function(doc, err) {
            assert.equal(null, err);
            resultArray.push(doc);
        }, function() {
            client.close();
            console.log(resultArray);
            res.redirect('/pre-rate-tweets');
        });
    });
});

router.post('/insert', function(req, res, next){

    res.cookie("counter",0);

    var item = {
        userid: userId,
        age: req.body.age,
        gender: req.body.gender,
        work: req.body.work,
        email: req.body.email
    };

    mongo.connect(url, function (err, client) {
    assert.equal(null, err);
    var db = client.db('users');
    db.collection('users').insertOne(item, function (err, result) {
        assert.equal(null, err);
        console.log('data inserted');
        client.close();
    });
    });
    res.redirect('/rate-tweets');
});


module.exports = router;

