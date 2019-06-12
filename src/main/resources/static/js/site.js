(() => {
  
	const siteNav = document.querySelector('.site-nav');
	const siteNavTrigger = document.querySelector('.site-nav-trigger');
  
	siteNavTrigger.addEventListener('click', () => {
	  siteNav.classList.toggle('active');
	});
  
})();