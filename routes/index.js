var debug = true;
var updateStats = false;
var express = require('express');
var router = express.Router();
var fs = require('fs');
var readlines = require('n-readlines');
var moment = require('moment');

var data_path = 'data/';
var annotation_path = 'annotation/';
var data_stats_file = 'data_stats.json';
var data_stats = [];
var anno_stats = {};

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
				if (items[i] == '.DS_Store') continue;
				
				var file_obj = {};
				var name = items[i];
				var file_path = data_path + name;
				var size = ((fs.statSync(file_path)['size'] / 100000) >> 0) / 10.0;
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
		if (err) console.log(err);
		else {
			data_stats = JSON.parse(data);
			if (debug) console.log(data_stats);
		}
	});
}
load_data_stats();

function loadAnnotationStats() {
	fs.readdir(annotation_path, function(err, items) {
		if (err) console.log(err);
		else {
			anno_stats = {};
			for (var i = 0; i < items.length; i++) {
				if (items[i] == '.DS_Store') continue;

				var file = annotation_path + items[i];
				var reader = new readlines(file);
				var line;
				while (line = reader.next()) {
					var lineStr = line.toString().trim();
					if (lineStr.length === 0) continue;

					var segments = lineStr.split('\t');
					var file = segments[0];
					var id = segments[1];
					var annotator = segments[2];
					console.log(file, id, annotator);
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
		// if (debug) console.log(docs);
		if (docs.length == 0) {
			res.render('anno_done', {annotator: annotator});
		} else {
			res.render('anno', {file: file, docs: docs, annotator: annotator});
		}
	});
});

router.post('/submit', function(req, res, next) {
	var datetime = moment().format('YYYYMMDD_HHmmss');
	var file = req.body.file;
	var annotator = req.body.annotator;
	var annotation = req.body.annotation;
	console.log('[' + datetime + ']Received annotations from annotator ' + annotator + ' of documents in file ' + file);
	// write to file
	var writer = fs.createWriteStream(annotation_path + annotator 
		+ '_' + datetime + '.txt');
	writer.on('error', function(err) {
		console.log(err);
		res.send(JSON.stringify({error: true}));
		return;
	});
	var annotated_id = {};
	for (var id in annotation) {
		if (annotation.hasOwnProperty(id)) {
			annotated_id[id] = true;
			var line = file + '\t' + id + '\t' + annotator + '\t';
			var anno = annotation[id]['annotation'];
			// console.log(anno);
			if (anno.hasOwnProperty('na') && anno['na'] == true) {
				line += 'na\n';
			} else {
				var first = true;
				for (var mf in anno) {
					if (anno.hasOwnProperty(mf) && anno[mf] == true) {
						if (first) {
							line += mf;
							first = false;
						} else {
							line += ',' + mf;
						}
					}
				}
				if (first) line += 'na\n';
				else line += '\n';
			}
			writer.write(line);
		}
	}
	writer.end();
	// update anno stats
	if (anno_stats.hasOwnProperty(annotator)) {
		var anno_list = anno_stats[annotator];
		if (anno_list.hasOwnProperty(file)) {
			var file_list = anno_list[file];
			for (var id in annotated_id) {
				if (annotated_id.hasOwnProperty(id)) {
					file_list[id] = true;
				}
			}
		} else {
			var file_list = annotated_id;
			anno_list[file] = file_list;
		}
	} else {
		var anno_list = {};
		var file_list = annotated_id;
		anno_list[file] = file_list;
		anno_stats[annotator] = anno_list;
	}
	res.send(JSON.stringify({error: false}));
});

// router.get('/anno_done', function(req, res, next) {
// 	var annotator = req.query.annotator;
// 	res.render('anno_done', {annotator: annotator});
// });

module.exports = router;
