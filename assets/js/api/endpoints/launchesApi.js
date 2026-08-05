import { request } from '../httpClient.js';
import { API_CONFIG } from '../config.js';

const { baseUrl } = API_CONFIG.launchLibrary;

export function getUpcomingLaunches({ limit = 10 } = {}) {
  return request(baseUrl, 'launch/upcoming/', { limit });
}
