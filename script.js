const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
  });
}

(function setActiveNav() {
  const links = document.querySelectorAll('[data-nav]');
  if (!links.length) {
    return;
  }

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  links.forEach((link) => {
    const href = link.getAttribute('data-nav');
    if (href === path) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
})();

const calendlyButtons = ['book-calendly', 'book-calendly-footer'];
const calendlyUrl = 'https://calendly.com/shubzz429/new-meeting';

calendlyButtons.forEach((id) => {
  const button = document.getElementById(id);
  if (!button) {
    return;
  }

  button.addEventListener('click', (event) => {
    event.preventDefault();
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer');
  });
});
