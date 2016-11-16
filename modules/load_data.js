var fs = require('fs');
var readlines = require('n-readlines');

module.exports = {
	read_annotation_directory: read_annotation_directory,
	count_line: count_line,
	load_issue_list: load_issue_list,
	update_data_stats: update_data_stats,
	load_data_stats: load_data_stats
}

// read annotation files under a specific directory
function read_annotation_directory(anno_path) {
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
		if (file == '.DS_Store') continue;

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
	});
	return anno_stats;
}

// count line number of a file
function count_line(file_path) {
	var count = 0;
	fs.createReadStream(process.argv[2]).on('data', function(chunk) {
	for (var i = 0; i < chunk.length; ++i) {
			if (chunk[i] == 10) count++;
		}
	})
	.on('end', function() {
		return count;
	});
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
	var file_stats = [];
	if (!data_path.endsWith('/')) data_path += '/';

	// collect meta data
	fs.readdirSync(data_path).forEach(function(file, index) {
		if (file == '.DS_Store') continue;
		var file_path = data_path + file;
		var file_obj = {};
		file_obj['name'] = file;
		file_obj['path'] = file_path;
		file_obj['size'] = ((fs.statSync(file_path)['size'] / 100000) >> 0) / 10.0;
		file_obj['doc'] = count_line(file_path);
		file_stats.push(file_obj);
	}
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