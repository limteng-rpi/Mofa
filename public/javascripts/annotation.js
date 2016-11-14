/* =================================================
 * Communication with the server and data processing 
 * ================================================= */
var fileAnnotation = {};
var annotator;
var file;
var availableTags = [];
var newTags = [];

// reset the current annotation field
function resetAnnotationField() {
	$('li.doc-item').each(function(i, v) {
		var id = $(v).attr('id');
		fileAnnotation[id] = {annotation: {na: true}, issue: ''};
	});
}

// highlight hashtags, usernames, and URLs
function highlight() {
	// highlight username
	$('.doc-body').each(function(i, v) {
		var text = $(v).text();
		text = text.replace(/(@([\w\d]+))/g, '<span class="doc-body-user"><a tabindex="-1" href="https://twitter.com/$2" target="_blank">$1</a></span>');
		text = text.replace(/(#([\w\d]+))/g, '<span class="doc-body-hashtag"><a tabindex="-1" href="https://twitter.com/hashtag/$2" target="_blank">$1</a></span>');
		text = text.replace(/((https?:\/\/(bit\.ly|t\.co|lnkd\.in|tcrn\.ch)\S*)\b)/g, '<span class="doc-body-url"><a tabindex="-1" href="$1" target="_blank">$1</a></span>');
		$(v).html(text);
	});
}

// click 'return' button
function returnButtonHandler() {
	$('button#return').click(function() {
		if (confirm('Return to the file list without saving the current annotations?\n(To save before leaving, click the "Next Batch" button first.)')) {
			window.location.href = "/list?annotator=" + annotator;
		}
	});
}

// click annotation buttons
function annotationButtonHandler() {
	$('span.doc-anno-btn').click(function() {
		var labeled = $(this).attr('labeled');
		var value = $(this).attr('value');
		var id = $(this).attr('id');
		if (labeled == 'true') {
			// the moral foundation is checked
			if (value != 'na') {
				$(this).attr('labeled', 'false');
				fileAnnotation[id]['annotation'][value] = false;
			}
		} else {
			// the moral foundation is not checked
			$(this).attr('labeled', 'true');
			if (value == 'na') {
				$('span.doc-anno-btn[value!="na"][id="' + id +'"]').attr('labeled', false);
				fileAnnotation[id]['annotation'][value] = true;
			} else {
				$('span.doc-anno-btn[value="na"][id="' + id + '"]').attr('labeled', false);
				fileAnnotation[id]['annotation'][value] = true;
				fileAnnotation[id]['annotation']['na'] = false;
			}
		}
	});
}


// send annotation results and new issues
function sendAnnotation() {
	$('button#next').click(function() {
		$.ajax({
			url: '/new_issue',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({issue_list: newTags}),
			dataType: 'json'
		});

		var submit = {annotator: annotator, annotation: fileAnnotation, file: file};
		$.ajax({
			url: '/submit',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(submit),
			dataType: 'json',
			success: function(res) {
				if (res.error) {
					console.log('submission error');
				} else {
					if (confirm('Your annotations have been submitted successfully.\nTo continue, click "yes"; otherwise, click "no" to return to the file list.')) {
						// $('html, body').scrollTop(0);
						// location.reload();
						$('#mask-layer').show();
						$('html, body').animate({
							scrollTop: 0
						}, {
							queue: false,
							duration: 200,
							complete: function() {
								location.reload();
							}
						});
					} else {
						window.location.href = "/list?annotator=" + annotator;
					}
				}
			}
		});
	});
}


// request tagged issues from the server
function requestIssueList() {
	$.getJSON('/issue', function(issueList) {
		availableTags = issueList;
		enableAutoCompletion();
	});
}

// enable auto completion for all text inputs
function enableAutoCompletion() {
	$('.doc-anno-issue').autocomplete({
		source: availableTags.concat(newTags)
	});
}

// update the issue list so that new issues tagged in the current page will appear in the candidates
function updateAutoCompletionTags() {
	$('.doc-anno-issue').change(function() {
		var id = $(this).attr('id');
		var tag = $(this).val().trim();
		fileAnnotation[id]['issue'] = tag;

		newTags = [];
		$('.doc-anno-issue').each(function(i, v) {
			var tag = $(v).val();
			if (tag.trim().length > 0) {
				if ($.inArray(tag, availableTags) && $.inArray(tag, newTags)) {
					newTags.push(tag);
				}
			}
		});
		enableAutoCompletion();
	});
}

$(document).ready(function() {
	file = $('#anno-field').attr('file');
	annotator = $('#anno-field').attr('annotator');

	requestIssueList();
	resetAnnotationField();
	annotationButtonHandler();
	sendAnnotation();
	returnButtonHandler();
	highlight();
	updateAutoCompletionTags();
});