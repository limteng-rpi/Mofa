function checkLoginItem() {
	$('#login-annotator').on('keyup paste', function() {
		var annotator = $(this).val().trim();
		if (annotator.length == 0) {
			$('button#login-enter').prop('disabled', true);
		} else {
			$('button#login-enter').prop('disabled', false);
		}
	});
}

function enterButtonHandler() {
	$('button#login-enter').click(function() {
		var annotator = $('#login-annotator').val().trim();
		var dataset = $("#login-dataset").val();
		window.location.href = "/list?annotator=" + annotator + '&dataset=' + dataset;
	});
}

$(document).ready(function() {
	checkLoginItem();
	enterButtonHandler();
})