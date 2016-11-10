var debug = true;
var updateStats = false;
var express = require('express');
var router = express.Router();
var fs = require('fs');
var readlines = require('n-readlines');

var data_path = 'data/';
var annotation_path = 'annotation/';
var data_stats_file = 'data_stats.json';
var data_stats = [];


/**
 * Update the data set stats
 */
if (updateStats) {
	console.log('Updating data set stats...');
	fs.readdir(data_path, function(err, items) {
		if (err) console.log(err);
		else {
			var file_stats = [];
			for (var i = 0; i < items.length; i++) {
				var file_obj = {};
				var name = items[i];
				var file_path = data_path + name;
				var size = ((fs.statSync(file_path)['size'] / 1000000) >> 0) / 10.0;
				var doc = count_line(file_path);
				file_obj['name'] = name;
				file_obj['path'] = file_path;
				file_obj['size'] = size;
				file_obj['doc'] = doc;
				file_stats.push(file_obj);
			}
			fs.writeFile(data_stats_file, JSON.stringify(file_stats));
		}
	});
}

/**
 * Load data set stats from file
 * To update the stats file, set updateStats to true and rerun this script.
 */
function load_data_stats() {
	fs.readFile(data_stats_file, 'utf8', function(err, data) {
		data_stats = JSON.parse(data);
		if (debug) console.log(data_stats);
	});
}
load_data_stats();



var anno_stats;
function loadAnnotationStats() {
	fs.readdir(annotation_path, function(err, items) {
		if (err) console.log(err);
		else {
			anno_stats = {};
			for (var i = 0; i < items.length; i++) {
				var file = annotation_path + items[i];
				var reader = new readlines(file);
				var line;
				while (line = reader.next()) {
					var segments = line.toString().split('\t');
					var file = segments[0];
					var id = segments[1];
					var annotator = segments[2];
					if (anno_stats.hasOwnProperty(annotator)) {
						var anno_list = anno_stats[annotator];
						if (anno_list.hasOwnProperty(file)) {
							var file_list = anno_list[file];
							file_list[id] = true;
						} else {
							var file_list = {};
							file_list[id] = true;
							anno_list[file] = file_list;
						}
					} else {
						var anno_list = {};
						var file_list = {};
						file_list[id] = true;
						anno_list[file] = file_list;
						anno_stats[annotator] = anno_list;
					}
				}
			}
			if (debug) console.log(anno_stats);
		}
	});
}
loadAnnotationStats();

/**
 * count line number (syncronically)
 * @param  {[type]} filename file to count
 * @return {[type]}          line number
 */
function count_line(filename) {
	var liner = new readlines(filename);
	var line;
	var count = 0;
	while (line = liner.next()) count++;
	return count;
}

var doc_per_page = 50;
function offer_doc(file, annotator, callback) {
	var reader = new readlines(data_path + file);
	var line;
	var count = 0;
	var docs = [];
	var exist_annotator = anno_stats.hasOwnProperty(annotator);
	while (line = reader.next()) {
		var lineStr = line.toString().trim();
		if (lineStr.length == 0) continue;
		var doc = JSON.parse(lineStr);
		var id = doc['id'];
		if (!exist_annotator || !anno_stats[annotator].hasOwnProperty(file)
			|| !anno_stats[annotator][file].hasOwnProperty(id)) {
			docs.push(doc);
		}

		if (docs.length >= doc_per_page) break;
	}
	callback(docs);
}

/* GET home page. */
router.get('/', function(req, res, next) {
	var annotator = req.query.annotator;

	annotator_data_stats = [];
	if (anno_stats.hasOwnProperty(annotator)) {
		for (var i = 0; i < data_stats.length; i++) {
			var file_stats = JSON.parse(JSON.stringify(data_stats[i]));
			
			if (anno_stats[annotator].hasOwnProperty(file_stats['name'])) {
				file_stats['annotated'] = Object.keys(anno_stats[annotator][file_stats['name']]).length;
			} else {
				file_stats['annotated'] = 0;
			}
			annotator_data_stats.push(file_stats);
		}
	} else {
		for (var i = 0; i < data_stats.length; i++) {
			var file_stats = JSON.parse(JSON.stringify(data_stats[i]));
			file_stats['annotated'] = 0;
			annotator_data_stats.push(file_stats);
		}
	}
	res.render('index', {data_stats: annotator_data_stats, annotator: annotator});
});

router.get('/annotation', function(req, res, next) {
	var file = req.query.file;
	var annotator = req.query.annotator;
	offer_doc(file, annotator, function(docs) {
		console.log(docs);
		res.render('anno', {file: file, docs: docs, annotator: annotator});
	});
});

module.exports = router;
