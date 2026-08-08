import { request } from '../api/httpClient.js';
import { API_CONFIG } from '../api/config.js';

const { baseUrl } = API_CONFIG.solarSystem;

function getPlanets() {
  return request(baseUrl, 'planets');
}

const AU_IN_KM = 149597870;

const PLANET_COLORS = {
  mercury: '#eab308',
  venus: '#f97316',
  earth: '#3b82f6',
  mars: '#ef4444',
  jupiter: '#fb923c',
  saturn: '#facc15',
  uranus: '#06b6d4',
  neptune: '#2563eb',
};

const PLANET_DESCRIPTIONS = {
  mercury:
    'Mercury is the smallest and innermost planet in the Solar System, with a surface heavily cratered from impacts, much like the Moon.',
  venus:
    "Venus is the second planet from the Sun and Earth's closest neighbor, wrapped in a thick, toxic atmosphere that traps heat and makes it the hottest planet.",
  earth:
    "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29% of Earth's surface is land consisting of continents and islands. The remaining 71% is covered with water, mostly by oceans, seas, gulfs, and other salt-water bodies, but also by lakes, rivers, and other fresh water, which together constitute the hydrosphere.",
  mars: 'Mars is the fourth planet from the Sun, known as the Red Planet for its iron-oxide-rich surface, and home to the largest volcano and canyon in the Solar System.',
  jupiter:
    'Jupiter is the largest planet in the Solar System, a gas giant famous for its Great Red Spot, a giant storm that has raged for centuries.',
  saturn:
    'Saturn is the second-largest planet, distinguished by its spectacular ring system made mostly of ice particles with a smaller amount of rocky debris.',
  uranus:
    'Uranus is an ice giant that rotates on its side, giving it extreme seasons, and it has a faint ring system and a pale blue-green color from methane in its atmosphere.',
  neptune:
    'Neptune is the outermost planet in the Solar System, an ice giant known for the fastest winds recorded on any planet, reaching supersonic speeds.',
};

const TYPE_BADGE_CLASSES = {
  Terrestrial: 'bg-orange-500/50 text-orange-200',
  'Gas Giant': 'bg-purple-500/50 text-purple-200',
  'Ice Giant': 'bg-cyan-500/50 text-cyan-200',
};

let earthMassKg = null;
let planetsById = {};

function planetKey(planet) {
  return planet.englishName.toLowerCase();
}

function massToKg({ massValue, massExponent }) {
  return massValue * 10 ** massExponent;
}

function formatScientific({ massValue, massExponent }) {
  return `${massValue} × 10^${massExponent}`;
}

function formatMillionsKm(km) {
  return `${(km / 1e6).toFixed(1)}M km`;
}

function formatOrbitalPeriod(days) {
  return days >= 365 ? `${(days / 365.25).toFixed(1)} years` : `${days} days`;
}

function renderPlanetDetail(planet) {
  document.getElementById('planet-detail-image').src =
    `./assets/images/${planetKey(planet)}.png`;
  document.getElementById('planet-detail-image').alt = planet.englishName;
  document.getElementById('planet-detail-name').textContent =
    planet.englishName;
  document.getElementById('planet-detail-description').textContent =
    PLANET_DESCRIPTIONS[planetKey(planet)] || '';

  document.getElementById('planet-distance').textContent = formatMillionsKm(
    planet.semimajorAxis,
  );
  document.getElementById('planet-radius').textContent =
    `${planet.meanRadius.toLocaleString()} km`;
  document.getElementById('planet-mass').textContent =
    `${formatScientific(planet.mass)} kg`;
  document.getElementById('planet-density').textContent =
    `${planet.density} g/cm³`;
  document.getElementById('planet-orbital-period').textContent =
    formatOrbitalPeriod(planet.sideralOrbit);
  document.getElementById('planet-rotation').textContent =
    `${planet.sideralRotation} hours`;
  document.getElementById('planet-moons').textContent = planet.moons
    ? planet.moons.length
    : 0;
  document.getElementById('planet-gravity').textContent =
    `${planet.gravity} m/s²`;

  document.getElementById('planet-discoverer').textContent =
    planet.discoveredBy || 'Known since antiquity';
  document.getElementById('planet-discovery-date').textContent =
    planet.discoveryDate || 'Ancient times';
  document.getElementById('planet-body-type').textContent = planet.bodyType;
  document.getElementById('planet-volume').textContent = planet.vol
    ? `${formatScientific({ massValue: planet.vol.volValue, massExponent: planet.vol.volExponent })} km³`
    : 'N/A';

  document.getElementById('planet-perihelion').textContent = formatMillionsKm(
    planet.perihelion,
  );
  document.getElementById('planet-aphelion').textContent = formatMillionsKm(
    planet.aphelion,
  );
  document.getElementById('planet-eccentricity').textContent =
    planet.eccentricity;
  document.getElementById('planet-inclination').textContent = planet.inclination
    ? `${planet.inclination}°`
    : 'N/A';
  document.getElementById('planet-axial-tilt').textContent =
    `${planet.axialTilt}°`;
  document.getElementById('planet-temp').textContent = `${planet.avgTemp}°C`;
  document.getElementById('planet-escape').textContent =
    `${(planet.escape / 1000).toFixed(2)} km/s`;
}

function renderPlanetFacts(planet) {
  const facts = [
    `Mass: ${formatScientific(planet.mass)} kg`,
    `Surface gravity: ${planet.gravity} m/s²`,
    `Density: ${planet.density} g/cm³`,
    `Axial tilt: ${planet.axialTilt}°`,
  ];

  const list = document.getElementById('planet-facts');
  list.innerHTML = '';
  facts.forEach((fact) => {
    const item = document.createElement('li');
    item.className = 'flex items-start';
    item.innerHTML = `
      <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
      <span class="text-slate-300">${fact}</span>
    `;
    list.appendChild(item);
  });
}

function highlightComparisonRow(id) {
  const rows = document.querySelectorAll('#planet-comparison-tbody tr');
  rows.forEach((row) => {
    row.classList.toggle('bg-blue-500/5', row.dataset.planetId === id);
  });
}

function showPlanetDetail(id) {
  const planet = planetsById[id];
  if (!planet) return;
  renderPlanetDetail(planet);
  renderPlanetFacts(planet);
  highlightComparisonRow(id);
}

function setupPlanetCards() {
  const cards = document.querySelectorAll('.planet-card');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      showPlanetDetail(card.dataset.planetId);
    });
  });
}

function createComparisonRow(planet) {
  const massKg = massToKg(planet.mass);
  const massRelativeToEarth = massKg / earthMassKg;
  const badgeClass =
    TYPE_BADGE_CLASSES[planet.type] || 'bg-slate-500/50 text-slate-200';

  const row = document.createElement('tr');
  row.className = 'hover:bg-slate-800/30 transition-colors';
  row.dataset.planetId = planetKey(planet);
  row.innerHTML = `
    <td class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10">
      <div class="flex items-center space-x-2 md:space-x-3">
        <div class="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0" style="background-color: ${PLANET_COLORS[planetKey(planet)] || '#94a3b8'}"></div>
        <span class="font-semibold text-sm md:text-base whitespace-nowrap">${planet.englishName}</span>
      </div>
    </td>
    <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${(planet.semimajorAxis / AU_IN_KM).toFixed(2)}</td>
    <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${(planet.meanRadius * 2).toLocaleString()}</td>
    <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${massRelativeToEarth.toFixed(3)}</td>
    <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${formatOrbitalPeriod(planet.sideralOrbit)}</td>
    <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${planet.moons ? planet.moons.length : 0}</td>
    <td class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
      <span class="px-2 py-1 rounded text-xs ${badgeClass}">${planet.type}</span>
    </td>
  `;
  return row;
}

function renderComparisonTable(planets) {
  const tbody = document.getElementById('planet-comparison-tbody');
  tbody.innerHTML = '';
  planets.forEach((planet) => tbody.appendChild(createComparisonRow(planet)));
}

async function loadPlanets() {
  try {
    const { bodies } = await getPlanets();
    planetsById = Object.fromEntries(
      bodies.map((planet) => [planetKey(planet), planet]),
    );
    console.log(planetsById);
    earthMassKg = massToKg(planetsById.earth.mass);

    renderComparisonTable(bodies);
    showPlanetDetail('earth');
  } catch (error) {
    console.error(`[API] ${error.message}`);
  }
}

export function setupPlanets() {
  setupPlanetCards();
  loadPlanets();
}
