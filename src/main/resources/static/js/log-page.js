(LogPage => {
	
	const dom = {};

	const cacheDom = () => {
		dom.logEntryForm = document.querySelector('.js-log-entry-form');
	};

	const submitLogEntryForm = event => {
		event.preventDefault();
		alert('NOT submitting this...');
	};

	const attachEventListeners = () => {
		dom.logEntryForm.addEventListener('submit', submitLogEntryForm);
	};

	const init = () => {
		cacheDom();
		attachEventListeners();
	};

	LogPage.init = init;

})(window.LogPage = window.LogPage || {});