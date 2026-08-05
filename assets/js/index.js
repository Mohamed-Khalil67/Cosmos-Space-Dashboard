import { getPlanets } from './api/endpoints/planetsApi.js';
import { getUpcomingLaunches } from './api/endpoints/launchesApi.js';
import { getApod } from './api/endpoints/apodApi.js';

async function init() {
  try {
    const planets = await getPlanets();
    const launches = await getUpcomingLaunches(5);
    const apod = await getApod({ date: '2023-06-01' });

    console.log(apod);
    console.log(launches);
    console.log(planets);
  } catch (error) {
    console.error(`[API] ${error.message}`);
  }
}

init();
