import { request } from '../httpClient.js';
import { API_CONFIG } from '../config.js';

const { baseUrl } = API_CONFIG.solarSystem;

export function getPlanets() {
  return request(baseUrl, 'planets');
}

export function getPlanetById(id) {
  return request(baseUrl, `planets/${id}`);
}
