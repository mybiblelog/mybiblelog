(() => {

  const breakpoint = 800;
  let navOpen = false;
  
  const siteNav = document.querySelector('.site-nav');
  const siteNavScreen = document.querySelector('.site-nav-screen');
  const siteNavTrigger = document.querySelector('.site-nav-trigger');
  const siteNavTriggerIcon = document.querySelector('.site-nav-trigger-icon');

  const update = () => {
    if (navOpen) {
      siteNav.classList.add('active');
      siteNavScreen.classList.add('active');
      siteNavTriggerIcon.classList.add('active');
      document.body.classList.add('modal-open');
    }
    else {
      siteNav.classList.remove('active');
      siteNavScreen.classList.remove('active');
      siteNavTriggerIcon.classList.remove('active');
      document.body.classList.remove('modal-open');
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

  window.addEventListener('resize', () => {
    if (window.innerWidth >= breakpoint && navOpen) {
      navOpen = false;
      update();
    }
  });
  
})();