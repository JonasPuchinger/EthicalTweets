var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var index = require('./routes/index');
var rateTweets = require('./routes/rate-tweets');
var results = require('./routes/results');
var preRateTweets = require('./routes/pre-rate-tweets');

var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static Assets
app.use(favicon(path.join(__dirname, 'public/images', 'logo.svg')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', index);
app.use('/rate-tweets', rateTweets);
app.use('/pre-rate-tweets', preRateTweets);
app.use('/results', results);

// Error Handling
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error', { title: 'Not Found', message: 'Not Found', status: '404' });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

module.exports = app;
