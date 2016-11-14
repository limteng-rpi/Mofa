var debug = false;
var update_stats = false;


var express = require('express');
var router = express.Router();
var fs = require('fs');
var readlines = require('n-readlines');
var moment = require('moment');

var data_path = 'data/';
var annotation_path = 'annotation/';
var data_stats_file = 'data_stats.json';
var issue_list_file = 'issue_list.txt';
var data_stats = [];
var anno_stats = {};
var issue_list = [];


var doc_per_page = 50;



/**
 * Load data set stats from file
 * To update the stats file, set updateStats to true and rerun this script.
 */
function load_data_stats() {
	console.log('Loading data set stats...');
	fs.readFile(data_stats_file, 'utf8', function(err, data) {
		if (err) console.log(err);
		else {
			data_stats = JSON.parse(data);
			if (debug) console.log(data_stats);
		}
	});
}


/**
 * Load annotation and calculate stats
 */
function load_annotation_stats() {
	console.log('Loading annotation stats...');
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

function load_issue_list() {
	console.log('Loading issue list...');
	issue_list = [];
	var reader = new readlines(issue_list_file);
	var line;
	while (line = reader.next()) {
		var lineStr = line.toString().trim();
		if (lineStr.length == 0) continue;
		issue_list.push(lineStr);
	}
}


function start() {
	// Update the data set stats
	if (update_stats) {
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
					file_obj['doc']  = doc;
					file_stats.push(file_obj);
				}
				fs.writeFile(data_stats_file, JSON.stringify(file_stats));
				console.log('Data set stats updated.');
				load_data_stats();
				load_annotation_stats();
				load_issue_list();
				console.log('Done');
			}
		});
	} else {
		load_data_stats();
		load_annotation_stats();
		load_issue_list();
		console.log('Done');
	}

	
}
start();

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
	res.render('index');
});

router.get('/list', function(req, res, next) {
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
	res.render('list', {data_stats: annotator_data_stats, annotator: annotator});
});

router.get('/annotation', function(req, res, next) {
	var file = req.query.file;
	var annotator = req.query.annotator;
	offer_doc(file, annotator, function(docs) {
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
			var issue = annotation[id]['issue'];
			if (anno.hasOwnProperty('na') && anno['na'] == true) {
				line += 'na';
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
				if (first) line += 'na';
				// else line += '\n';
			}
			line += '\t' + issue + '\n';
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


/* Send issue list for auto completion */
router.get('/issue', function(req, res, next) {
	res.send(issue_list);
})


/* Receive new issues */
router.post('/new_issue', function(req, res, next) {
	var new_issue_list = req.body.issue_list;
	// console.log(new_issue_list);
	// update issue_list
	for (var i = 0; i < new_issue_list.length; i++) {
		if (issue_list.indexOf(new_issue_list[i]) == -1) {
			issue_list.push(new_issue_list[i]);
			fs.appendFileSync(issue_list_file, new_issue_list[i] + '\n');
		}
	}
});

module.exports = router;
