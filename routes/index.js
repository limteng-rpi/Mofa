var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/annotation', function(req, res, next) {
	res.render('anno');
});

module.exports = router;
