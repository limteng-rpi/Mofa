function updateProgressBar() {
	$('.progress-bar').each(function(i, v) {
		var annotatedNumber = $(v).attr('progress');
		var totalNumber = $(v).attr('total');
		if (annotatedNumber == 0) $(v).width(0);
		else $(v).width(annotatedNumber / totalNumber * 150);
		// console.log(annotatedNumber);
	});
}

$(document).ready(function() {
	updateProgressBar();
});