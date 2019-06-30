(() => {
  
  const siteNav = document.querySelector('.site-nav');
  const siteNavScreen = document.querySelector('.site-nav-screen');
  const siteNavTrigger = document.querySelector('.site-nav-trigger');
  const siteNavTriggerIcon = document.querySelector('.site-nav-trigger-icon');
  
  let navOpen = false;

  const update = () => {
    if (navOpen) {
      siteNav.classList.add('active');
      siteNavScreen.classList.add('active');
      siteNavTriggerIcon.classList.add('active');
    }
    else {
      siteNav.classList.remove('active');
      siteNavScreen.classList.remove('active');
      siteNavTriggerIcon.classList.remove('active');
    }
  };

	siteNavTrigger.addEventListener('click', () => {
    navOpen = !navOpen;
    update();
  });
  
	siteNavScreen.addEventListener('click', () => {
    navOpen = false;
    update();
  });
  
})();