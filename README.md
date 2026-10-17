# 🪐 COSMOS: Space Dashboard

A space dashboard that pulls live data from public APIs: NASA's Astronomy Picture of the Day, upcoming rocket launches and the planets of the solar system.

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-222?style=for-the-badge&logo=github)](https://mohamed-khalil67.github.io/Cosmos-Space-Dashboard/)

## Features

- **Astronomy Picture of the Day** from the NASA API, browsable by date
- **Upcoming launches** from The Space Devs Launch Library API
- **Planets** data from a solar-system open-data API
- Loading and error states for each data source
- Responsive layout

## Tech stack

HTML5 · CSS3 · Vanilla JavaScript (ES modules) · Bootstrap · Font Awesome · NASA APOD API · The Space Devs API

## Code structure

```
assets/js/
├── index.js            entry point, wires features together
├── api/
│   ├── config.js       base URLs and keys
│   └── httpClient.js   one reusable request() helper
└── features/           apod · launches · planets
```

`JS_NOTES.md` holds my study notes on the patterns used here (destructuring, optional chaining, `dataset`, template literals, lookup tables).

> Uses NASA's public `DEMO_KEY` (rate limited). For heavier use, get a free key at https://api.nasa.gov and set it in `assets/js/api/config.js`.

## Run locally

No build step. Clone the repo and open `index.html` in a browser (or use the VS Code Live Server extension).

```bash
git clone https://github.com/Mohamed-Khalil67/Cosmos-Space-Dashboard.git
cd Cosmos-Space-Dashboard
```

## Author

**Mohamed Khalil**: [GitHub](https://github.com/Mohamed-Khalil67) · [Portfolio](https://portfolio-swart-omega-11.vercel.app) · [LinkedIn](https://www.linkedin.com/in/mohamed-khalil-ucbl/)
