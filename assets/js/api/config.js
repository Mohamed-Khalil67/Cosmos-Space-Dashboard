export const API_CONFIG = {
  solarSystem: {
    baseUrl: 'https://solar-system-opendata-proxy.vercel.app/api/',
  },
  nasa: {
    baseUrl: 'https://api.nasa.gov/planetary/',
    // 'DEMO_KEY' is NASA's public, rate-limited key. Get your own free key at
    // https://api.nasa.gov and replace it. Never commit a personal key.
    apiKey: 'DEMO_KEY',
  },
  launchLibrary: {
    baseUrl: 'https://lldev.thespacedevs.com/2.3.0/',
  },
};
