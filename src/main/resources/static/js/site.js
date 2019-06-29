(() => {
  
  const siteNav = document.querySelector('.site-nav');
  const siteNavScreen = document.querySelector('.site-nav-screen');
  const siteNavTrigger = document.querySelector('.site-nav-trigger');
  
	siteNavTrigger.addEventListener('click', () => {
    siteNav.classList.toggle('active');
    siteNavScreen.classList.toggle('active');
  });
  
	siteNavScreen.addEventListener('click', () => {
    siteNav.classList.remove('active');
    siteNavScreen.classList.remove('active');
  });
  
})();