import { setupApod } from './features/apod.js';
import { setupPlanets } from './features/planets.js';
import { setupLaunches } from './features/launches.js';

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.app-section');

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.dataset.section;

      sections.forEach((section) => {
        section.classList.toggle('hidden', section.id !== targetId);
      });

      navLinks.forEach((navLink) => {
        navLink.classList.toggle('bg-blue-500/10', navLink === link);
        navLink.classList.toggle('text-blue-400', navLink === link);
        navLink.classList.toggle('text-slate-300', navLink !== link);
      });
    });
  });
}

function init() {
  setupNavigation();
  setupApod();
  setupPlanets();
  setupLaunches();
}

init();
