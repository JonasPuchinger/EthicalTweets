var express = require('express');
var router = express.Router();
var PythonShell = require('python-shell');

router.get('/', function(req, res, next) {
  var options = {
    mode: 'text',
    scriptPath: './public/python',
    args: ['Hello', 'World']
  };

  // Test zum Aufrufen von Python-Scripts mit oben beschriebenen Optionen
  PythonShell.run('test.py', options, function (err, results) {
    if (err) throw err;
    res.send('Results: ' + results);
  });
});

module.exports = router;
