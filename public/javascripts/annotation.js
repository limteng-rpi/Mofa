/* =================================================
 * Communication with the server and data processing 
 * ================================================= */
var fileAnnotation = {};
var annotator;
var file;

// reset the current annotation field
function resetAnnotationField() {
	$('li.doc-item').each(function(i, v) {
		var id = $(v).attr('id');
		fileAnnotation[id] = {'annotation': {'n/a': true}};
	});
}


function generateAnnotationField() {
	if (data === undefined || data.length === 0) {
		// todo: error action
	} else {
		var docList = $('ul#doc-list');
		$.each(data, function(i, v) {
			var item = $('<li class="doc-item"></li>');
			// append tweet metadata
			var meta = $('<div class="doc-meta">' + v.id + ' | ' + v.postedTime +  '</li>');
			item.append(meta);
			// append tweet body
			var body = $('<div class="doc-body">' + v.body + '</li>');
			item.append(body);
			// append annotation bar
			item.append(generateAnnotationBar(v.id));
			docList.append(item);
		});
		var endText = $('<p id="anno-end">= End of this batch =</p>');
		docList.append(endText);
	}
}

function generateAnnotationBar(id) {
	var annoBar = $('<div class="doc-anno noselect"></div>');
	var careBtn        = $('<span class="doc-anno-btn" value="care" id="' + id + '">care</span>');
	var harmBtn        = $('<span class="doc-anno-btn" value="harm" id="' + id + '">harm</span>');
	var fairnessBtn    = $('<span class="doc-anno-btn" value="fairness" id="' + id + '">fairness</span>');
	var cheatingBtn    = $('<span class="doc-anno-btn" value="cheating" id="' + id + '">cheating</span>');
	var loyaltyBtn     = $('<span class="doc-anno-btn" value=""loyalty id="' + id + '">loyalty</span>');
	var betrayalBtn    = $('<span class="doc-anno-btn" value="betrayal" id="' + id + '">betrayal</span>');
	var authorityBtn   = $('<span class="doc-anno-btn" value="authority" id="' + id + '">authority</span>');
	var subversionBtn  = $('<span class="doc-anno-btn" value="subversion" id="' + id + '">subversion</span>');
	var purityBtn      = $('<span class="doc-anno-btn" value="purity" id="' + id + '">purity</span>');
	var degradationBtn = $('<span class="doc-anno-btn" value="degradation" id="' + id + '">degradation</span>');
	annoBar.append(careBtn, harmBtn, fairnessBtn, cheatingBtn, loyaltyBtn, 
		betrayalBtn, authorityBtn, subversionBtn, purityBtn, degradationBtn);
	return annoBar;
}


function highlight() {
	// highlight username
	$('.doc-body').each(function(i, v) {
		var text = $(v).text();
		text = text.replace(/(@([\w\d]+))/g, '<span class="doc-body-user"><a href="https://twitter.com/$2" target="_blank">$1</a></span>');
		text = text.replace(/(#([\w\d]+))/g, '<span class="doc-body-hashtag"><a href="https://twitter.com/hashtag/$2" target="_blank">$1</a></span>');
		text = text.replace(/((https?:\/\/(bit\.ly|t\.co|lnkd\.in|tcrn\.ch)\S*)\b)/g, '<span class="doc-body-url"><a href="$1" target="_blank">$1</a></span>');
		$(v).html(text);
	});
}

function returnButtonHandler() {
	$('button#return').click(function() {
		if (confirm('Return to the file list without saving the current annotations?\n(To save before leaving, click the "Next Batch" button first.)')) {
			window.location.href = "/?annotator=" + $(this).attr('annotator');
		}
	});
}

function annotationButtonHandler() {
	$('span.doc-anno-btn').click(function() {
		var labeled = $(this).attr('labeled');
		var value = $(this).attr('value');
		var id = $(this).attr('id');
		if (labeled == 'true') {
			// the moral foundation is checked
			if (value != 'n/a') {
				$(this).attr('labeled', 'false');
				fileAnnotation[id][value] = false;
			}
		} else {
			// the moral foundation is not checked
			$(this).attr('labeled', 'true');
			if (value == 'n/a') {
				$('span.doc-anno-btn[value!="n/a"][id="' + id +'"]').attr('labeled', false);
				fileAnnotation[id][value] = true;
			} else {
				$('span.doc-anno-btn[value="n/a"][id="' + id + '"]').attr('labeled', false);
				fileAnnotation[id][value] = true;
				fileAnnotation[id]['n/a'] = false;
			}
		}
	});
}

function sendAnnotation() {
	var submit = {annotator: annotator, annotation: fileAnnotation, file: file};
	$.post('/submit', submit).done(function() {

	});
}

$(document).ready(function() {
	file = $('#anno-field').attr('file');
	annotator = $('#anno-field').attr('annotator');
	// resetAnnotationField()
	// generateAnnotationField();
	resetAnnotationField();
	annotationButtonHandler();
	returnButtonHandler();
	highlight();
});