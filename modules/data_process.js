var fs = require('fs');
var readlines = require('n-readlines');

var raw_data_path = 'data/';
var sample_data_path = 'data_random/';

module.exports = {
	random_sample: random_sample,
	read_anno_directory: read_anno_directory,
	load_issue_list: load_issue_list,
	update_data_stats: update_data_stats,
	load_data_stats: load_data_stats,
	load_doc_list: load_doc_list,
	write_doc_list: write_doc_list
}


// randon sample
function random_sample(file_number) {
	console.log('Random sampling...');
	// clean the sample data path
	delete_directory_content(sample_data_path);
	// create file writers
	var writers = [];
	for (var i = 0; i < file_number; i++) {
		var writer = fs.createWriteStream(sample_data_path + 'random_sample_set_' + (i + 1) + '.json');
		writers.push(writer);
	}
	// write tweets to random sets
	var line;
	fs.readdirSync(raw_data_path).forEach(function(file, index) {
		// console.log('[' + (index + 1) +']sampling file: ' + file)
		var cur_file = raw_data_path + file;
		var reader = new readlines(cur_file);
		while (line = reader.next()) {
			var lineStr = line.toString().trim();
			if (lineStr.length == 0) continue;
			var random_num = Math.floor(Math.random() * file_number);
			writers[random_num].write(lineStr + '\n');
		}
	});
	// close all writers
	var flushed_num = 0;
	for (var i = 0; i < file_number; i++) {
		writers[i].end();
	}

	console.log('Random sampling finished.');
}


// clean files in a directory
function delete_directory_content(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file, index) {
			var cur_file = path + file;
			fs.unlinkSync(cur_file);
		});
	} else {
		fs.mkdirSync(path);
	}
}

// read annotation files under a specific directory
function read_anno_directory(anno_path) {
	var anno_stats = {};
	if (!anno_path.endsWith('/')) anno_path += '/';
	
	console.log('Loading annotation stats from ' + anno_path);
	
	// create the annotation directory if it doesn't exist
	if (!fs.existsSync(anno_path)) {
		fs.mkdirSync(anno_path);
		return anno_stats;
	}

	// read all annotation files
	fs.readdirSync(anno_path).forEach(function(file, index) {
		// ignore the .DS_Store file (in macOS)
		if (file != '.DS_Store') {
			var file_path = anno_path + file;
			var line;
			var reader = new readlines(file_path);
			while (line = reader.next()) {
				var lineStr = line.toString().trim();
				if (lineStr.length === 0) continue;

				var segments = lineStr.split('\t');
				var file = segments[0];
				var id   = segments[1];
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
	});
	return anno_stats;
}

// count line number of a file
// function count_line(file_path) {
// 	var count = 0;
// 	fs.createReadStream(file_path).on('data', function(chunk) {
// 	for (var i = 0; i < chunk.length; ++i) {
// 			if (chunk[i] == 10) count++;
// 		}
// 	})
// 	.on('end', function() {
// 		return count;
// 	});
// }
function count_line(filename) {
	var liner = new readlines(filename);
	var line;
	var count = 0;
	while (line = liner.next()) count++;
	return count;
}

// load issue list
function load_issue_list(file_path) {
	console.log('Loading issue list...');

	var issue_list = [];
	var reader = new readlines(file_path);
	var line;
	while (line = reader.next()) {
		var lineStr = line.toString().trim();
		if (lineStr.length === 0) continue;
		issue_list.push(lineStr);
	}
	return issue_list;
}

// update data stats
function update_data_stats(data_path, data_stats_file) {
	console.log('Updating data set stats...');
	var file_stats = [];
	if (!data_path.endsWith('/')) data_path += '/';

	// collect meta data
	fs.readdirSync(data_path).forEach(function(file, index) {
		if (file != '.DS_Store') {
			var file_path = data_path + file;
			var file_obj = {};
			file_obj['name'] = file;
			file_obj['path'] = file_path;
			file_obj['size'] = ((fs.statSync(file_path)['size'] / 10000) >> 0) / 100.0;
			file_obj['doc'] = count_line(file_path);
			file_stats.push(file_obj);
		}
	});
	// write to file
	fs.writeFileSync(data_stats_file, JSON.stringify(file_stats));
	console.log('Data set stats updated.');
}

// load data stats
function load_data_stats(data_stats_file) {
	console.log('Loading data set stats...');
	var content = fs.readFileSync(data_stats_file, 'utf8').toString();
	return JSON.parse(content);
}

// load doc list
function load_doc_list(doc_list_file) {
	console.log('Loading doc list from: ' + doc_list_file);
	var content = {};
	if (fs.existsSync(doc_list_file)) {
		var file_content = fs.readFileSync(doc_list_file, 'utf8').toString();
		if (file_content != undefined && file_content.length > 0) {
			content = JSON.parse(fs.readFileSync(doc_list_file, 'utf8').toString());
		}
	}
	return content;
}

// update doc list
function write_doc_list(doc_list_file, doc_list) {
	fs.writeFileSync(doc_list_file, JSON.stringify(doc_list));
}