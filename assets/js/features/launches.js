import { request } from '../api/httpClient.js';
import { API_CONFIG } from '../api/config.js';

const { baseUrl } = API_CONFIG.launchLibrary;
const PLACEHOLDER_IMAGE = './assets/images/launch-placeholder.png';

function getUpcomingLaunches(limit = 10) {
  return request(baseUrl, 'launches/upcoming/', { limit });
}

const STATUS_BADGE_CLASSES = {
  Go: 'bg-green-500/90',
  TBD: 'bg-blue-500/90',
  TBC: 'bg-yellow-500/90',
};

function statusBadgeClass(abbrev) {
  return STATUS_BADGE_CLASSES[abbrev] || 'bg-slate-500/90';
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLongDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso) {
  const time = new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
  return `${time} UTC`;
}

function daysUntil(iso) {
  const diffMs = new Date(iso) - new Date();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function renderFeaturedLaunch(launch) {
  const container = document.getElementById('featured-launch');
  const badgeClass = statusBadgeClass(launch.status?.abbrev);

  container.innerHTML = `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-star"></i>
                Featured Launch
              </span>
              <span class="px-4 py-1.5 ${badgeClass} text-white rounded-full text-sm font-semibold">
                ${launch.status?.abbrev ?? 'TBD'}
              </span>
            </div>
            <h3 class="text-3xl font-bold mb-3 leading-tight">${launch.name}</h3>
            <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
              <div class="flex items-center gap-2">
                <i class="fas fa-building"></i>
                <span>${launch.launch_service_provider?.name ?? 'Unknown'}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-rocket"></i>
                <span>${launch.rocket?.configuration?.name ?? 'Unknown'}</span>
              </div>
            </div>
            <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
              <i class="fas fa-clock text-2xl text-blue-400"></i>
              <div>
                <p class="text-2xl font-bold text-blue-400">${daysUntil(launch.net)}</p>
                <p class="text-xs text-slate-400">Days Until Launch</p>
              </div>
            </div>
            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-calendar"></i>
                  Launch Date
                </p>
                <p class="font-semibold">${formatLongDate(launch.net)}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-clock"></i>
                  Launch Time
                </p>
                <p class="font-semibold">${formatTime(launch.net)}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-map-marker-alt"></i>
                  Location
                </p>
                <p class="font-semibold text-sm">${launch.pad?.location?.name ?? 'Unknown'}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-globe"></i>
                  Country
                </p>
                <p class="font-semibold">${launch.pad?.location?.country?.name ?? 'Unknown'}</p>
              </div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-6">${launch.mission?.description ?? 'No mission details available.'}</p>
          </div>
          <div class="flex flex-col md:flex-row gap-3">
            <button class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2">
              <i class="fas fa-info-circle"></i>
              View Full Details
            </button>
            <div class="icons self-end md:self-center">
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">
                <i class="far fa-heart"></i>
              </button>
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">
                <i class="fas fa-bell"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="relative">
          <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
            <img
              src="${launch.image?.image_url ?? PLACEHOLDER_IMAGE}"
              onerror="this.src='${PLACEHOLDER_IMAGE}'"
              alt="${launch.name}"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createLaunchCard(launch) {
  const card = document.createElement('div');
  card.className =
    'bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer';

  card.innerHTML = `
    <div class="relative h-48 bg-slate-900/50">
      <img
        src="${launch.image?.thumbnail_url ?? PLACEHOLDER_IMAGE}"
        onerror="this.src='${PLACEHOLDER_IMAGE}'"
        alt="${launch.name}"
        class="w-full h-full object-cover"
      />
      <div class="absolute top-3 right-3">
        <span class="px-3 py-1 ${statusBadgeClass(launch.status?.abbrev)} text-white backdrop-blur-sm rounded-full text-xs font-semibold">
          ${launch.status?.abbrev ?? 'TBD'}
        </span>
      </div>
    </div>
    <div class="p-5">
      <div class="mb-3">
        <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">${launch.name}</h4>
        <p class="text-sm text-slate-400 flex items-center gap-2">
          <i class="fas fa-building text-xs"></i>
          ${launch.launch_service_provider?.name ?? 'Unknown'}
        </p>
      </div>
      <div class="space-y-2 mb-4">
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-calendar text-slate-500 w-4"></i>
          <span class="text-slate-300">${formatShortDate(launch.net)}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-clock text-slate-500 w-4"></i>
          <span class="text-slate-300">${formatTime(launch.net)}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-rocket text-slate-500 w-4"></i>
          <span class="text-slate-300">${launch.rocket?.configuration?.name ?? 'Unknown'}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <i class="fas fa-map-marker-alt text-slate-500 w-4"></i>
          <span class="text-slate-300 line-clamp-1">${launch.pad?.location?.name ?? 'Unknown'}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
        <button class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">Details</button>
        <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
      </div>
    </div>
  `;

  return card;
}

function renderLaunchGrid(launches) {
  const grid = document.getElementById('launches-grid');
  grid.innerHTML = '';
  launches.forEach((launch) => grid.appendChild(createLaunchCard(launch)));
}

function updateLaunchCount(count) {
  document.getElementById('launches-count').textContent = `${count} Launches`;
  document.getElementById('launches-count-mobile').textContent = count;
}

export async function setupLaunches() {
  try {
    const { results } = await getUpcomingLaunches();
    renderFeaturedLaunch(results[0]);
    renderLaunchGrid(results.slice(1));
    updateLaunchCount(results.length);
  } catch (error) {
    console.error(`[API] ${error.message}`);
  }
}
