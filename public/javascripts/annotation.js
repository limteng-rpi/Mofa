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
	annotationButtonHandler();
})