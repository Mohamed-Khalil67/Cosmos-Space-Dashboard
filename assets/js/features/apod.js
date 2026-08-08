import { request } from '../api/httpClient.js';
import { API_CONFIG } from '../api/config.js';

const { baseUrl, apiKey } = API_CONFIG.nasa;

function getApod(date) {
  return request(baseUrl, 'apod', { api_key: apiKey, date });
}

function renderApod(apod) {
  document.getElementById('apod-image').src = apod.url;
  document.getElementById('apod-title').textContent = apod.title;
  document.getElementById('apod-explanation').textContent = apod.explanation;
  document.getElementById('apod-date').textContent =
    `Astronomy Picture of the Day - ${apod.date}`;
  document.getElementById('apod-date-detail').textContent = apod.date;
  document.getElementById('apod-date-info').textContent = apod.date;
  document.getElementById('apod-media-type').textContent = apod.media_type;

  const copyright = document.getElementById('apod-copyright');
  copyright.textContent = apod.copyright ? `© ${apod.copyright}` : '';
  copyright.classList.toggle('hidden', !apod.copyright);

  document.getElementById('apod-loading').classList.add('hidden');
  document.getElementById('apod-image').classList.remove('hidden');
}

function showApodLoading() {
  document.getElementById('apod-loading').classList.remove('hidden');
  document.getElementById('apod-image').classList.add('hidden');
}

async function loadApod(date) {
  showApodLoading();
  try {
    const apod = await getApod(date);
    renderApod(apod);
  } catch (error) {
    console.error(`[API] ${error.message}`);
  }
}

function formatPickedDate(value) {
  if (!value) return 'Select date';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function setupApodControls() {
  const dateInput = document.getElementById('apod-date-input');
  const dateWrapper = dateInput.closest('.date-input-wrapper');
  const loadBtn = document.getElementById('load-date-btn');
  const todayBtn = document.getElementById('today-apod-btn');

  const today = new Date().toISOString().split('T')[0];
  dateInput.max = today;
  dateWrapper.dataset.date = 'Select date';

  dateInput.addEventListener('change', () => {
    dateWrapper.dataset.date = formatPickedDate(dateInput.value);
  });

  loadBtn.addEventListener('click', () => {
    if (dateInput.value) loadApod(dateInput.value);
  });

  todayBtn.addEventListener('click', () => {
    dateInput.value = today;
    dateWrapper.dataset.date = formatPickedDate(today);
    loadApod();
  });
}

export function setupApod() {
  setupApodControls();
  loadApod();
}
