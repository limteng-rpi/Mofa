var random_sample = false;
var update_stats = false;
var debug = false;


var express = require('express');
var router = express.Router();
var fs = require('fs');
var readlines = require('n-readlines');
var moment = require('moment');
var data_process = require('../modules/data_process')

var data_path = 'data/';
var complete_data_path = 'data/';
var random_data_path = 'data_random/'

var annotation_path = 'annotation/';
var complete_anno_path = 'annotation/';
var random_anno_path = 'annotation_random/';

var data_stats_file = 'data_stats.json';
var complete_data_stats_file = 'data_stats.json';
var random_data_stats_file = 'data_stats_random.json';

var issue_list_file = 'issue_list.txt';

// var data_stats = [];
// var anno_stats = {};
var issue_list = [];


var doc_per_page = 50;
var random_file_number = 20;

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
	// create the annotation directory if it doesn't exist
	if (!fs.existsSync(annotation_path)) {
		fs.mkdirSync(annotation_path);
		return;
	}

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

var complete_data_stats = [];
var complete_anno_stats = {};
var random_data_stats = [];
var random_anno_stats = {};
function start() {
	if (random_sample) {
		data_process.random_sample(random_file_number);
		console.log('[!] Re-run the program.');
	} else if (update_stats) {
		data_process.update_data_stats(complete_data_path, complete_data_stats_file);
		if (fs.existsSync(random_data_path)) {
			data_process.update_data_stats(random_data_path, random_data_stats_file);
		}
		console.log('[!] Re-run the program.');
	} else {
		complete_data_stats = data_process.load_data_stats(complete_data_stats_file);
		complete_anno_stats = data_process.read_anno_directory(complete_anno_path);
		if (fs.existsSync(random_data_path) && fs.existsSync(random_data_stats_file)) {
			random_data_stats   = data_process.load_data_stats(random_data_stats_file);
			random_anno_stats   = data_process.read_anno_directory(random_anno_path);
		}
	}

	// Update the data set stats
	// if (update_stats) {
	// 	console.log('Updating data set stats...');
	// 	fs.readdir(data_path, function(err, items) {
	// 		if (err) console.log(err);
	// 		else {
	// 			var file_stats = [];
	// 			for (var i = 0; i < items.length; i++) {
	// 				if (items[i] == '.DS_Store') continue;
					
	// 				var file_obj = {};
	// 				var name = items[i];
	// 				var file_path = data_path + name;
	// 				var size = ((fs.statSync(file_path)['size'] / 100000) >> 0) / 10.0;
	// 				var doc = count_line(file_path);
	// 				file_obj['name'] = name;
	// 				file_obj['path'] = file_path;
	// 				file_obj['size'] = size;
	// 				file_obj['doc']  = doc;
	// 				file_stats.push(file_obj);
	// 			}
	// 			fs.writeFile(data_stats_file, JSON.stringify(file_stats));
	// 			console.log('Data set stats updated.');
	// 			load_data_stats();
	// 			load_annotation_stats();
	// 			load_issue_list();
	// 			console.log('Done');
	// 		}
	// 	});
	// } else {
	// 	load_data_stats();
	// 	load_annotation_stats();
	// 	load_issue_list();
	// 	console.log('Done');
	// }
}
start();

function offer_doc(file, annotator, dataset, callback) {
	var data_path = (dataset == 'complete')? complete_data_path : random_data_path;
	var anno_stats = (dataset == 'complete')? complete_anno_stats : random_anno_stats;
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
	var datasets = [{name: "Complete", value: "complete"}];
	if (fs.existsSync(random_data_path) && fs.existsSync(random_data_stats_file)) {
		datasets.push({name: "Random", value: "random"});
	}
	res.render('index', {datasets: datasets});
});


router.get('/list', function(req, res, next) {
	var annotator = req.query.annotator;
	var dataset = req.query.dataset;

	var anno_stats;
	var data_stats;
	if (dataset == 'complete') {
		anno_stats = complete_anno_stats;
		data_stats = complete_data_stats;
	} else {
		anno_stats = random_anno_stats;
		data_stats = random_data_stats;
	}
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
	res.render('list', {data_stats: annotator_data_stats, annotator: annotator, dataset: dataset});
});


router.get('/annotation', function(req, res, next) {
	var file = req.query.file;
	var annotator = req.query.annotator;
	var dataset = req.query.dataset;
	offer_doc(file, annotator, dataset, function(docs) {
		if (docs.length == 0) {
			res.render('anno_done', {annotator: annotator, dataset: dataset});
		} else {
			res.render('anno', {file: file, docs: docs, annotator: annotator, dataset: dataset});
		}
	});
});


router.post('/submit', function(req, res, next) {
	var datetime = moment().format('YYYYMMDD_HHmmss');
	var file = req.body.file;
	var annotator = req.body.annotator;
	var annotation = req.body.annotation;
	var dataset = req.body.dataset;
	console.log('[' + datetime + ']Received annotations from annotator ' + annotator + ' of documents in file ' + file);
	// write to file
	var anno_path = (dataset == 'complete')? complete_anno_path : random_anno_path;
	var writer = fs.createWriteStream(anno_path + annotator 
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
			// ignore skipped tweets, which will be shown again in the next batch
			// if (Object.keys(anno).length === 0 && anno.constructor === Object) continue;
			if (anno.hasOwnProperty('nm') && anno['nm'] == true) {
				line += 'nm';
			} else {
				var value_num = 0;
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
				if (first) line += 'nm';
				// else line += '\n';
			}
			line += '\t' + issue + '\n';
			writer.write(line);
		}
	}
	writer.end();
	// update anno stats
	var anno_stats = (dataset == 'complete')? complete_anno_stats : random_anno_stats;
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
});


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


// router.get('/random_sample', function(req, res, next) {
// 	res.render('random.jade');
// });

module.exports = router;
