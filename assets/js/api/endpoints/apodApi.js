import { request } from '../httpClient.js';
import { API_CONFIG } from '../config.js';

const { baseUrl, apiKey } = API_CONFIG.nasa;

export function getApod({ date } = {}) {
  return request(baseUrl, 'apod', { api_key: apiKey, date });
}
