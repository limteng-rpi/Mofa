/* =================================================
 * Communication with the server and data processing 
 * ================================================= */
var data = [
{
	id: "tag:search.twitter.com,2005:587103055784599554",
	body: "RT @noellebelangerr: Long live flannel",
	postedTime: "2015-04-07T14:54:28.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}, {
	id: "tag:search.twitter.com,2005:587103055822192641",
	body: "Realizing that you have a girl that you've been searching for is one of the best feelings.",
	postedTime: "2011-11-04T04:02:27.000Z"
}

];

// reset the current annotation field
function resetAnnotationField() {
	var docList = $('ul#doc-list');
	docList.empty();
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

function annotationButtonHandler() {
	$('span.doc-anno-btn').click(function() {
		var labeled = $(this).attr('labeled');
		if (labeled == 'true') {
			// the moral foundation is checked
			$(this).attr('labeled', 'false');
		} else {
			// the moral foundation is not checked
			$(this).attr('labeled', 'true');
		}
	});
}

$(document).ready(function() {
	resetAnnotationField()
	generateAnnotationField();
	annotationButtonHandler();
})