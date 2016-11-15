var fs = require('fs');
var readlines = require('n-readlines');

var raw_data_path = 'data/';
var sample_data_path = 'data_random/';

module.exports = {
	random_sample: random_sample,
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