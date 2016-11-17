/* =================================================
 * Communication with the server and data processing 
 * ================================================= */
var fileAnnotation = {};
var annotator;
var file;
var dataset;
var availableTags = [];
var newTags = [];

// reset the current annotation field
function resetAnnotationField() {
	$('li.doc-item').each(function(i, v) {
		var id = $(v).attr('docid');
		fileAnnotation[id] = {annotation: {}, issue: '', comment: '', mark: '', markstart: -1, markend: -1};
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
			window.location.href = "/list?annotator=" + annotator + '&dataset=' + dataset;
		}
	});
}

// click annotation buttons
function annotationButtonHandler() {
	$('span.doc-anno-btn').click(function() {
		var labeled = $(this).attr('labeled');
		var value = $(this).attr('value');
		var id = $(this).attr('docid');

		if (labeled == 'true') {
			// the moral foundation is checked
			if (value != 'nm') {
				$(this).attr('labeled', 'false');
				fileAnnotation[id]['annotation'][value] = false;
			}
		} else {
			// the moral foundation is not checked
			$(this).attr('labeled', 'true');
			if (value == 'nm') {
				$('span.doc-anno-btn[value!="nm"][docid="' + id +'"]').attr('labeled', false);
				fileAnnotation[id]['annotation'][value] = true;
			} else {
				$('span.doc-anno-btn[value="nm"][docid="' + id + '"]').attr('labeled', false);
				fileAnnotation[id]['annotation'][value] = true;
				fileAnnotation[id]['annotation']['nm'] = false;
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

		validAnnotation = {};
		$.each(fileAnnotation, function(k, v) {
			if (!$.isEmptyObject(v.annotation)) {
				validAnnotation[k] = v;
			}
		});
		var submit = {annotator: annotator, annotation: validAnnotation, file: file};
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
						window.location.href = '/list?annotator=' + annotator + '&dataset=' + dataset;
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
		var id = $(this).attr('docid');
		var tag = $(this).val().trim().replace('/[\t\n]/g', ' ');
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

function updateComment() {
	$('.doc-anno-comment').change(function() {
		var id = $(this).attr('docid');
		var comment = $(this).val().trim().replace('/[\t\n]/g', ' ');
		fileAnnotation[id]['comment'] = comment;
	});
}

function markIssue() {
	$('.doc-body').on('mouseup', function() {
		var id = $(this).attr('docid');
		var select = getSelectedText();
		var baseParent = select.baseNode.parentNode;
		var extentParent = select.extentNode.parentNode;
		var startOffset = select.baseOffset;
		var endOffset = select.extentOffset;
		if (baseParent === extentParent) {
			if (startOffset != endOffset) {
				$('span.doc-body-selected[docid="' + id + '"]').contents().unwrap();
				$('span.doc-body-selected[docid="' + id + '"]').remove();

				var range = select.getRangeAt(0);
				if (range.toString().length > 0 && Math.abs(range.startOffset - range.endOffset) == range.toString().length) {
					// add span
					var newNode = document.createElement('span');
	        		newNode.setAttribute('class', 'doc-body-selected');
	        		newNode.setAttribute('docid', id);
	        		range.surroundContents(newNode);
	        		// remove '\n'
        			$(this).html($(this).html().replace('/[\n]/g', ''));
        			// calculate offsets
        			var selectStartOffset;
        			if ($('span.doc-body-selected[docid="' + id + '"]')[0].previousSibling == null) {
        				selectStartOffset = 0;
        			} else {
        				selectStartOffset = $('span.doc-body-selected[docid="' + id + '"]')[0].previousSibling.nodeValue.length;
        			}
        			var selectEndOffset = selectStartOffset + $('span.doc-body-selected[docid="' + id + '"]')[0].textContent.length;
        			// console.log(selectStartOffset, selectEndOffset);
        			fileAnnotation[id]['mark'] = $('span.doc-body-selected[docid="' + id + '"]')[0].textContent;
        			fileAnnotation[id]['markstart'] = selectStartOffset;
        			fileAnnotation[id]['markend'] = selectEndOffset;
	        	} else {
	        		// clean annotation
	        		fileAnnotation[id]['mark'] = '';
	        		fileAnnotation[id]['markstart'] = -1;
	        		fileAnnotation[id]['markend'] = -1;
	        	}
	        	document.getSelection().removeAllRanges();
        	} else {
        		$('span.doc-body-selected[docid="' + id + '"]').contents().unwrap();
        		$('span.doc-body-selected[docid="' + id + '"]').remove();
        		$(this).html($(this).html().replace('/[\n]/g', ''));
        		// clean annotation
	        	fileAnnotation[id]['mark'] = '';
	        	fileAnnotation[id]['markstart'] = -1;
	        	fileAnnotation[id]['markend'] = -1;
        	}
		}
	});
}

function cleanIssue() {
	$('.doc-body').on('click', function() {

	})
}

// Grab selected text
function getSelectedText(){
	var select;
    if(window.getSelection){ 
    	console.log('window.getSelection');
    	select = window.getSelection();
    } 
    else if(document.getSelection){ 
    	console.log('document.getSelection');
    	select = document.getSelection();
    } 
    else if(document.selection){
    	console.log('document.selection');
        select = document.selection.createRange();
    }
    // console.log(select);
    return select;
} 

$(document).ready(function() {
	file = $('#anno-field').attr('file');
	annotator = $('#anno-field').attr('annotator');
	dataset = $('#anno-field').attr('dataset');

	requestIssueList();
	resetAnnotationField();
	annotationButtonHandler();
	sendAnnotation();
	returnButtonHandler();
	// highlight();
	updateAutoCompletionTags();
	markIssue();
	updateComment();
});