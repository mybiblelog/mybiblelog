(LogPage => {
	
	const dom = {};
	const model = {
		book: 				0,
		startChapter: 0,
		startVerse: 	0,
		endChapter: 	0,
		endVerse: 		0,
	};

	const cacheDom = () => {
		dom.logEntryForm = document.querySelector('.js-log-entry-form');
		// TODO: get 4 other dropdowns
	};

	const render = () => {
		// TODO: use the model to update the DOM
	};

	const onSelectBook = () => {
		// TODO: populate start chapter 
		render();
	};

	const onSelectStartChapter = () => {
		// TODO: populate start verse select
		render();
	};

	const onSelectStartVerse = () => {
		// TODO:
		render();
	};

	const onSelectEndChapter = () => {
		// TODO:
		render();
	};

	const onSelectEndVerse = () => {
		// TODO:
		render();
	};

	const onSubmitLogEntryForm = event => {
		event.preventDefault();

		// TODO: ensure the minimum number of fields is selected
		
		// TODO: generate startVerseId and endVerseId

		// TODO: submit request

		// TODO: update state with result

		// TODO: render page
	};

	const attachEventListeners = () => {
		dom.logEntryForm.addEventListener('submit', onSubmitLogEntryForm);
		// TODO: attach 4 dropdown event listeners
	};

	const init = () => {
		cacheDom();
		attachEventListeners();
	};

	LogPage.init = init;

})(window.LogPage = window.LogPage || {});