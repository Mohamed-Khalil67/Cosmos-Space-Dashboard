# JavaScript Notes — Space Dashboard

Study notes on the JS patterns used in this project. Each section shows the real code
from the codebase, what it does, and *why* it's written that way.

---

## Table of contents

1. [Map of the codebase](#1-map-of-the-codebase)
2. [The `request()` helper, line by line](#2-the-request-helper-line-by-line)
3. [Object shorthand `{ limit }`](#3-object-shorthand--limit-)
4. [Destructuring](#4-destructuring)
5. [`Object.fromEntries()` + `.map()`](#5-objectfromentries--map)
6. [`?.` and `??`](#6--and-)
7. [`classList.toggle(class, force)`](#7-classlisttoggleclass-force)
8. [`dataset` — storing state on DOM elements](#8-dataset--storing-state-on-dom-elements)
9. [`innerHTML` + template literals](#9-innerhtml--template-literals)
10. [Lookup tables instead of `if` / `switch`](#10-lookup-tables-instead-of-if--switch)
11. [Numbers: `**` and `.toFixed()`](#11-numbers--and-tofixed)
12. [Dates: subtracting two `Date` objects](#12-dates-subtracting-two-date-objects)
13. [Case study: the deleted `apodApi.js`](#13-case-study-the-deleted-apodapijs)
14. [Quick reference](#14-quick-reference)

---

## 1. Map of the codebase

```
index.js                 entry point — wires everything together
  ├── features/planets.js    fetches + renders planet data
  ├── features/launches.js   fetches + renders launch data
  └── api/
        ├── config.js        base URLs + API keys
        └── httpClient.js    the shared request() function
```

**Three layers:**

| Layer | Job | Files |
|---|---|---|
| Entry | Boot the app, handle navigation | `index.js` |
| Feature | Fetch + render one section | `planets.js`, `launches.js` |
| API | Build URLs, call `fetch`, handle errors | `config.js`, `httpClient.js` |

Both feature files depend on the API layer. Neither knows about the other. This is why
deleting the APOD feature only required removing one file plus its import — nothing else
broke.

---

## 2. The `request()` helper, line by line

`assets/js/api/httpClient.js`

```js
export async function request(baseUrl, path, params = {}) {
  const url = new URL(path, baseUrl);

  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
```

### 2.1 `new URL(path, baseUrl)`

**Naive version:**
```js
const url = `${baseUrl}${path}?limit=${limit}`;
```

**Problems with the naive version:**
- Breaks on missing or doubled slashes (`.../2.3.0launches/` or `.../2.3.0//launches/`)
- Doesn't URL-encode special characters in values (a space becomes a broken URL)
- You have to hand-write `?` for the first param and `&` for the rest

`new URL(path, baseUrl)` resolves `path` *relative to* `baseUrl` using real URL rules, and
gives you a `.searchParams` object that handles encoding and `?` / `&` automatically.

**The URL object's parts** — using the URL this app actually builds:

```
https://lldev.thespacedevs.com/2.3.0/launches/upcoming/?limit=10
└─┬──┘ └────────┬────────────┘└──────────┬───────────┘└───┬────┘
.protocol   .hostname                .pathname         .search
```

**Other things on a URL object** (not used here, but available):

| Property / method | What it gives you |
|---|---|
| `.href` | the full URL as a string |
| `.origin` | protocol + host, e.g. `https://api.nasa.gov` |
| `.hash` | the `#fragment` part |
| `.toString()` | same as `.href` |

**On `.searchParams`:**

| Method | What it does |
|---|---|
| `.set(k, v)` | set a param, **overwriting** any existing value ← used here |
| `.append(k, v)` | add a param, **keeping** duplicates (`?tag=a&tag=b`) |
| `.get(k)` / `.getAll(k)` | read a value back out |
| `.has(k)` | check if a param exists |
| `.delete(k)` | remove a param |
| `.sort()` | alphabetize the params |
| `.forEach()` / `.entries()` | loop over all params |

> You never need `url.toString()` before `fetch(url)` — `fetch` accepts a `URL` object
> directly and stringifies it internally.

### 2.2 Why loop over `params`?

There's no built-in "object → query string, skipping empty values" conversion, so it's
done manually one key at a time:

```js
for (const key in params) {
  const value = params[key];
  if (value === undefined || value === null) continue;
  url.searchParams.set(key, value);
}
```

The loop is what makes **one** `request()` function work for **every** endpoint. Different
callers pass different shapes:

```js
getPlanets()             → request(baseUrl, 'planets')              // params = {} (default)
getUpcomingLaunches(10)  → request(baseUrl, 'launches/upcoming/', { limit: 10 })
```

The loop just walks whatever keys happen to be there.

> **Note:** `for...in` isn't technically required. `Object.entries(params).forEach(...)`
> or `Object.keys(params).forEach(...)` would behave identically for a plain object.
> It's a style choice, not a technical one.

### 2.3 The `null` / `undefined` skip

```js
if (value === undefined || value === null) continue;
```

Without this line, calling a function with an optional param left out would produce a
literal string in the URL:

```
?date=undefined     ← the API sees the text "undefined" and errors or ignores it
```

With it, missing params are simply left off the URL entirely. **See §13 for the function
this was actually written for.**

### 2.4 `if (!response.ok) throw`

This is the single most important line to understand about `fetch`.

> **`fetch()` does not reject on HTTP errors.**
> A 404 or a 500 is still a *successful* fetch — the request went out, a response came
> back. The promise only rejects if the network itself fails (offline, DNS failure,
> CORS block).

So without this check, a 500 response would flow straight into `response.json()`, which
would then try to parse an HTML error page as JSON and throw a confusing
`SyntaxError: Unexpected token '<'` instead of a clear "Request failed: 500".

`response.ok` is `true` for any status in the 200–299 range.

Throwing here means both features can wrap their whole load in one `try` / `catch`:

```js
try {
  const { results } = await getUpcomingLaunches();
  // ...render
} catch (error) {
  console.error(`[API] ${error.message}`);
}
```

### 2.5 `return response.json()` — no `await`

```js
return response.json();        // ← what's written
return await response.json();  // ← also correct, just redundant
```

Both work identically. Returning a promise from an `async` function automatically flattens
it, and the caller `await`s it either way. The extra `await` adds a pointless microtask.

---

## 3. Object shorthand `{ limit }`

`assets/js/features/launches.js`

```js
function getUpcomingLaunches(limit = 10) {
  return request(baseUrl, 'launches/upcoming/', { limit });
}
```

`limit` is just a number. `{ limit }` wraps it in an **object**:

```js
{ limit }          // shorthand
{ limit: limit }   // exactly the same thing
```

ES6 lets you drop the duplicate name when the property name matches the variable name.

### Why it must be an object

`request()` loops over its third argument with `for (const key in params)`. If you passed
the bare number:

```js
request(baseUrl, 'launches/upcoming/', limit);  // ✗ wrong
```

...the loop would find no enumerable keys on a primitive number, and `limit` would never
make it into the URL. The object is what supplies the **key** (`"limit"`) and the
**value** (`10`) needed to build `?limit=10`.

### The key name is not arbitrary

It must be `limit` because that's the exact query parameter name the Launch Library API
expects. `{ count: limit }` would produce `?count=10`, which the API wouldn't recognize.

### Multiple params

Just add more properties:

```js
function getUpcomingLaunches(limit = 10, offset = 0) {
  return request(baseUrl, 'launches/upcoming/', { limit, offset });
}
// → ?limit=10&offset=0
```

### When the variable name ≠ the API's param name

Use the explicit `key: value` form. You can mix both styles freely in one object:

```js
function getUpcomingLaunches(limit = 10, query) {
  return request(baseUrl, 'launches/upcoming/', {
    limit,           // shorthand — names match
    search: query,   // explicit — API wants "search", variable is "query"
  });
}
```

Optional params work for free because of the `null` check in §2.3 — call
`getUpcomingLaunches(10)` with no `query` and `search` is simply omitted from the URL.

---

## 4. Destructuring

Destructuring pulls values *out* of an object into standalone variables. It's the mirror
image of the shorthand in §3 (which packs values *into* an object).

### 4.1 At module level

```js
// planets.js
const { baseUrl } = API_CONFIG.solarSystem;

// same as:
const baseUrl = API_CONFIG.solarSystem.baseUrl;
```

### 4.2 On a response

```js
const { bodies } = await getPlanets();
const { results } = await getUpcomingLaunches();
```

The API returns a big object like `{ bodies: [...], ... }`; this grabs just the one field
that matters and ignores everything else.

### 4.3 In a function's parameter list

```js
function massToKg({ massValue, massExponent }) {
  return massValue * 10 ** massExponent;
}
```

The function doesn't receive a variable called `massValue` — it receives **an object**,
and immediately unpacks two fields from it. Called like this:

```js
massToKg(planet.mass);   // planet.mass = { massValue: 5.97, massExponent: 24 }
```

**Why this is confusing at first:** the parameter list *looks* like it's declaring two
arguments, but it's declaring one argument and destructuring it.

### 4.4 The tricky reuse in `planets.js`

`formatScientific` has the same destructured shape:

```js
function formatScientific({ massValue, massExponent }) {
  return `${massValue} × 10^${massExponent}`;
}
```

But look at how it gets called for **volume**, which has completely different field names
(`volValue` / `volExponent`):

```js
formatScientific({
  massValue: planet.vol.volValue,
  massExponent: planet.vol.volExponent,
})
```

The caller *renames* the volume fields to match what `formatScientific` expects. It works,
but it's misleading — the function is really "format any value + exponent pair," not
anything to do with mass. A clearer version would name the params `{ value, exponent }`.

**Lesson:** name destructured params after what they *are*, not after the first thing you
happened to use them for.

---

## 5. `Object.fromEntries()` + `.map()`

`assets/js/features/planets.js`

```js
planetsById = Object.fromEntries(
  bodies.map((planet) => [planetKey(planet), planet]),
);
```

Read it **inside out**, in three stages:

### Stage 1 — the array from the API

```js
[
  { englishName: "Mercury", mass: {...} },
  { englishName: "Venus",   mass: {...} },
  { englishName: "Earth",   mass: {...} },
]
```

### Stage 2 — `.map()` turns each planet into a `[key, value]` pair

```js
bodies.map((planet) => [planetKey(planet), planet])
```

`planetKey(planet)` is just `planet.englishName.toLowerCase()`. Result:

```js
[
  ["mercury", { englishName: "Mercury", ... }],
  ["venus",   { englishName: "Venus",   ... }],
  ["earth",   { englishName: "Earth",   ... }],
]
```

After `.map()` you no longer have an array of planets — you have an array of **pairs**.

### Stage 3 — `Object.fromEntries()` turns pairs into object properties

```js
{
  mercury: { englishName: "Mercury", ... },
  venus:   { englishName: "Venus",   ... },
  earth:   { englishName: "Earth",   ... },
}
```

> `Object.fromEntries()` is the **inverse** of `Object.entries()`.
> `Object.entries(obj)` → array of pairs. `Object.fromEntries(pairs)` → object.

### Why build the lookup at all?

Because of how the rest of the file uses it:

```js
function showPlanetDetail(id) {
  const planet = planetsById[id];   // instant property read
  if (!planet) return;
  // ...
}
```

`showPlanetDetail` runs on every planet-card click, plus once on load for `'earth'`.
Without the lookup, every call would need a search:

```js
const planet = bodies.find((p) => planetKey(p) === id);   // walks the array every time
```

Building the lookup **once** means every later access is a direct property read. For 8
planets the speed difference is irrelevant — the real win is that the code is shorter and
expresses the intent ("planets addressed by name") directly.

### The same reasoning behind `earthMassKg`

```js
earthMassKg = massToKg(planetsById.earth.mass);
```

Computed once and cached, because every row of the comparison table divides by it to get
`massRelativeToEarth`. Compute once, use many times.

---

## 6. `?.` and `??`

### 6.1 Optional chaining `?.`

```js
launch.status?.abbrev
```

If `launch.status` is `null` or `undefined`, the whole expression **short-circuits** to
`undefined` instead of throwing `TypeError: Cannot read properties of undefined`.

### 6.2 Chained `?.`

```js
launch.rocket?.configuration?.name
```

Each `?.` guards the step *after* it. If `rocket` is missing, evaluation stops immediately
— `configuration` is never touched.

### 6.3 Nullish coalescing `??`

```js
launch.rocket?.configuration?.name ?? 'Unknown'
```

`??` supplies a fallback when the left side is `null` or `undefined`.

| Data | Result |
|---|---|
| `rocket.configuration.name = "Falcon 9"` | `"Falcon 9"` |
| `rocket = null` | `"Unknown"` |
| `rocket = {}` (no `configuration`) | `"Unknown"` |
| `configuration = { name: null }` | `"Unknown"` |
| `configuration = { name: "" }` | `""` ← **empty string passes through!** |

### 6.4 `??` vs `||` — the important difference

| Operator | Falls back on |
|---|---|
| `??` | `null`, `undefined` — **only** |
| `\|\|` | `null`, `undefined`, `0`, `""`, `false`, `NaN` |

`??` is the safer default here. If the code used `||`, then a real value of `0` — like a
planet with `moons.length === 0` — would be wrongly replaced by the fallback.

### 6.5 Where the codebase does it differently

```js
document.getElementById('planet-moons').textContent = planet.moons
  ? planet.moons.length
  : 0;
```

This uses a ternary rather than `planet.moons?.length ?? 0`, because the API returns
`null` for `moons` on moonless planets and the display should show `0`, not blank. Both
forms work; the `?.` version is shorter.

---

## 7. `classList.toggle(class, force)`

`toggle()` has **two** forms, and the second one is the one that trips people up.

| 2nd argument | class present? | result | behaves like |
|---|---|---|---|
| *omitted* | yes | removed | flip |
| *omitted* | no | added | flip |
| `true` | yes | stays on | `.add()` |
| `true` | no | added | `.add()` |
| `false` | yes | removed | `.remove()` |
| `false` | no | stays off | `.remove()` |

**With a second argument, `toggle()` stops flipping and starts *matching*** — the class
ends up present exactly when the boolean is `true`, regardless of its previous state.

### Why that matters here

`index.js`:

```js
sections.forEach((section) => {
  section.classList.toggle('hidden', section.id !== targetId);
});
```

Reads as: *"hide this section if it isn't the target."* One line handles **all** sections —
the target gets `hidden` removed, every other section gets it added.

Without the second argument you'd need branching:

```js
sections.forEach((section) => {
  if (section.id === targetId) section.classList.remove('hidden');
  else section.classList.add('hidden');
});
```

Same idea for the nav links and for `planets.js`:

```js
row.classList.toggle('bg-blue-500/5', row.dataset.planetId === id);
```

*"Highlight this row if it is the selected planet."*

---

## 8. `dataset` — storing state on DOM elements

```js
// writing (planets.js)
row.dataset.planetId = planetKey(planet);

// reading (planets.js)
card.addEventListener('click', () => {
  showPlanetDetail(card.dataset.planetId);
});
```

`element.dataset.planetId` maps to the HTML attribute `data-planet-id`.

> **Naming rule:** `data-planet-id` in HTML ⇄ `dataset.planetId` in JS.
> Kebab-case in the markup, camelCase in the code.

**Why use it:** it answers "which planet does this DOM element represent?" without keeping
a parallel array or `Map` in sync with the DOM. The element carries its own identity, so a
click handler can read it directly and pass it to `showPlanetDetail(id)`.

**Caveat:** `dataset` values are **always strings**. `el.dataset.count = 5` then reading it
back gives `"5"`, not `5`.

---

## 9. `innerHTML` + template literals

```js
card.innerHTML = `
  <div class="p-5">
    <h4>${launch.name}</h4>
    <p>${launch.launch_service_provider?.name ?? 'Unknown'}</p>
  </div>
`;
```

Backtick strings let you write multi-line HTML with `${}` placeholders. Fast to write and
easy to read for card markup.

### The security caveat

There is **no escaping** here. Whatever is in `launch.name` gets injected as raw HTML. If
an API ever returned:

```js
launch.name = '<img src=x onerror="alert(1)">'
```

...that script would execute. This is called an **XSS** (cross-site scripting) vulnerability.

**Why it's acceptable in this project:** the data comes from trusted third-party space
APIs, not from user input. But the moment any of these values could be typed by a user,
this pattern becomes a real risk.

**Safer alternative for plain text:**
```js
element.textContent = launch.name;   // always inserts as text, never as HTML
```

Notice `planets.js` already uses `textContent` for all its detail fields — that's the safe
one. `innerHTML` is reserved for places where actual markup is being built.

### `createElement` vs `innerHTML`

The codebase uses both:

```js
// launches.js — build an element, then fill it
const card = document.createElement('div');
card.className = 'bg-slate-800/50 ...';
card.innerHTML = `...`;
return card;

// then append
launches.forEach((launch) => grid.appendChild(createLaunchCard(launch)));
```

Note `grid.innerHTML = ''` **before** the loop — that clears any previous render so cards
don't accumulate on re-render.

---

## 10. Lookup tables instead of `if` / `switch`

```js
const STATUS_BADGE_CLASSES = {
  Go: 'bg-green-500/90',
  TBD: 'bg-blue-500/90',
  TBC: 'bg-yellow-500/90',
};

function statusBadgeClass(abbrev) {
  return STATUS_BADGE_CLASSES[abbrev] || 'bg-slate-500/90';
}
```

**Instead of:**

```js
function statusBadgeClass(abbrev) {
  if (abbrev === 'Go') return 'bg-green-500/90';
  else if (abbrev === 'TBD') return 'bg-blue-500/90';
  else if (abbrev === 'TBC') return 'bg-yellow-500/90';
  else return 'bg-slate-500/90';
}
```

**Advantages:**
- Adding a new status = adding one line to the object, no logic change
- The mapping is *data*, so it's visible at a glance
- The `||` fallback handles any unknown status without breaking the UI

Same pattern appears three times in this codebase:

| Table | Maps |
|---|---|
| `STATUS_BADGE_CLASSES` | launch status → Tailwind classes |
| `TYPE_BADGE_CLASSES` | planet type → Tailwind classes |
| `PLANET_COLORS` | planet name → hex color |

> Here `||` is fine rather than `??`, because the only "falsy" outcome of a missing key is
> `undefined` anyway — there are no legitimate `0` or `""` values in these tables.

---

## 11. Numbers: `**` and `.toFixed()`

### 11.1 The `**` exponentiation operator

```js
function massToKg({ massValue, massExponent }) {
  return massValue * 10 ** massExponent;
}
```

`**` is "raise to the power of." `10 ** 24` is 10²⁴. It's the modern equivalent of:

```js
Math.pow(10, massExponent)
```

**Why it exists in this code:** the API returns masses in scientific notation split into
two fields, because the real number is too large to be readable:

```js
{ massValue: 5.97, massExponent: 24 }   // Earth = 5.97 × 10²⁴ kg
```

`massToKg` reassembles them into an actual JS number so masses can be compared:

```js
const massRelativeToEarth = massKg / earthMassKg;
```

**Precedence gotcha:** `**` binds tighter than `*`, so
`massValue * 10 ** massExponent` is `massValue * (10 ** massExponent)` — which is what's
intended. Adding parentheses would make it clearer for a reader.

### 11.2 `.toFixed(n)`

```js
(planet.semimajorAxis / AU_IN_KM).toFixed(2)   // "1.00"
massRelativeToEarth.toFixed(3)                 // "1.000"
(planet.escape / 1000).toFixed(2)              // "11.19"
```

Rounds to `n` decimal places **and returns a string**, not a number. Fine for display;
never do math on the result.

### 11.3 `.toLocaleString()`

```js
planet.meanRadius.toLocaleString()   // 6371 → "6,371"
```

Formats a number with thousands separators according to the user's locale.

---

## 12. Dates: subtracting two `Date` objects

```js
function daysUntil(iso) {
  const diffMs = new Date(iso) - new Date();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
```

### Why can you subtract two objects?

When JS applies `-` to objects, it converts them to primitives first. For `Date`, that
conversion produces a **number**: milliseconds since 1 January 1970 (the "Unix epoch").

So `dateA - dateB` is really `dateA.getTime() - dateB.getTime()` — the gap between them in
milliseconds.

> **Gotcha:** this works for `-` but **not** for `+`.
> `dateA + dateB` converts to *strings* and concatenates them into garbage.
> Always use `.getTime()` explicitly if you want to be unambiguous.

### The rest of the line

```js
diffMs / (1000 * 60 * 60 * 24)
//         ms    s    min  hr    → milliseconds to days
```

The multiplication chain is left unevaluated on purpose — `1000 * 60 * 60 * 24` documents
*why* the number is 86,400,000. Writing the raw constant would be faster to read for a
computer and slower for a human.

- `Math.ceil(...)` rounds **up**, so a launch 0.3 days away shows as "1 day," not "0."
- `Math.max(0, ...)` clamps negatives to zero, so a launch that already happened shows "0"
  instead of a negative number.

### Date formatting

```js
new Date(iso).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});
// → "Jun 1, 2023"
```

`toLocaleDateString(locale, options)` builds a human-readable date. The options object
picks which parts appear and in what style (`'short'` = "Jun", `'long'` = "June").

```js
new Date(iso).toLocaleTimeString('en-US', {
  hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
});
```

`timeZone: 'UTC'` is important here — launch times are published in UTC, and without this
the browser would silently convert to the viewer's local timezone and display a different
time than the official schedule.

---

## 13. Case study: the deleted `apodApi.js`

This file was removed during the refactor, but it's the single best example in the project
of several patterns combining. Recovered from git history:

```js
import { request } from '../httpClient.js';
import { API_CONFIG } from '../config.js';

const { baseUrl, apiKey } = API_CONFIG.nasa;

export function getApod({ date } = {}) {
  return request(baseUrl, 'apod', { api_key: apiKey, date });
}
```

Four things happen in these seven lines.

### 13.1 Destructuring two fields at once

```js
const { baseUrl, apiKey } = API_CONFIG.nasa;
```

Unlike the planets/launches modules which only need `baseUrl`, NASA's API also requires a
key, so both come out in one statement.

### 13.2 `{ date } = {}` — the default that prevents a crash

This is the subtle one. The parameter is:

```js
function getApod({ date } = {}) { ... }
```

There are **two** things going on:
- `{ date }` — destructure a `date` field out of the argument
- `= {}` — if no argument is passed at all, use an empty object instead

**Why the `= {}` is mandatory:**

```js
// WITHOUT the default:
function getApod({ date }) { ... }
getApod();
// ✗ TypeError: Cannot destructure property 'date' of 'undefined' as it is undefined.
```

You cannot destructure `undefined`. The `= {}` gives destructuring something safe to work
on, so `getApod()` with no arguments succeeds and `date` simply comes out as `undefined`.

> **Rule of thumb:** any time you destructure a parameter that might not be passed,
> give it `= {}`.

### 13.3 Renaming a key for the API's convention

```js
{ api_key: apiKey, date }
```

Both styles from §3 in one object:

| Written | Why |
|---|---|
| `api_key: apiKey` | **explicit** — NASA's API wants snake_case `api_key`, but JS convention is camelCase `apiKey`, so the names can't match |
| `date` | **shorthand** — the variable name and the API's param name are both `date` |

### 13.4 This is why `request()` skips `null` / `undefined`

Now §2.3 makes sense. Trace what happens for each call:

```js
getApod({ date: '2023-06-01' })
// params = { api_key: 'G5HO...', date: '2023-06-01' }
// → https://api.nasa.gov/planetary/apod?api_key=G5HO...&date=2023-06-01

getApod()
// params = { api_key: 'G5HO...', date: undefined }
// → date is SKIPPED by the null check
// → https://api.nasa.gov/planetary/apod?api_key=G5HO...
```

That second URL is exactly right — NASA's APOD endpoint returns **today's** picture when
no `date` is given. Without the skip in `request()`, the URL would be
`...&date=undefined` and the API would reject it.

**The lesson:** the `if (value === undefined || value === null) continue;` line isn't
defensive paranoia. It's what lets a caller express "I don't have a value for this
param" simply by not passing one.

### 13.5 What the refactor changed

**Before** (`index.js` at commit `f0fd619`) — everything in one place, just logging:

```js
async function init() {
  try {
    const planets = await getPlanets();
    const launches = await getUpcomingLaunches(5);
    const apod = await getApod({ date: '2023-06-01' });
    console.log(apod);
    // ...
  } catch (error) {
    console.error(`[API] ${error.message}`);
  }
}
```

**After** — `index.js` only composes; each feature owns its own fetching, rendering, and
error handling:

```js
function init() {
  setupNavigation();
  setupPlanets();
  setupLaunches();
}
```

> **Note:** the three `await`s in the old version ran **sequentially** — each request
> waited for the previous one to finish. Since they don't depend on each other, they could
> have run in parallel with `Promise.all([...])`. The new structure sidesteps this because
> `setupPlanets()` and `setupLaunches()` are both `async` and are called without `await`,
> so they run concurrently.

---

## 14. Quick reference

| Pattern | Example from the code | One-line meaning |
|---|---|---|
| `new URL(path, base)` | `new URL('planets', baseUrl)` | Build a URL safely, get `.searchParams` free |
| `{ limit }` | `request(url, path, { limit })` | Shorthand for `{ limit: limit }` |
| `{ key: var }` | `{ api_key: apiKey }` | Rename when the API's name differs |
| `{ x } = {}` | `getApod({ date } = {})` | Destructure a param that might not be passed |
| `?.` | `launch.status?.abbrev` | Stop safely if the left side is null/undefined |
| `??` | `... ?? 'Unknown'` | Fallback **only** for null/undefined |
| `\|\|` | `TABLE[key] \|\| fallback` | Fallback for **any** falsy value |
| `Object.fromEntries(map)` | `planetsById` | Array → lookup object |
| `toggle(cls, bool)` | `toggle('hidden', id !== target)` | Make the class *match* the boolean |
| `dataset.x` | `card.dataset.planetId` | Read/write `data-x` on an element |
| `**` | `10 ** massExponent` | Exponentiation (`Math.pow`) |
| `dateA - dateB` | `new Date(iso) - new Date()` | Difference in milliseconds |
| `!response.ok` | `if (!response.ok) throw` | `fetch` does **not** throw on 404/500 |

### Things to remember

1. **`fetch` doesn't reject on HTTP errors** — always check `response.ok`.
2. **`??` ≠ `||`** — `??` only catches `null`/`undefined`; `||` also catches `0` and `""`.
3. **Destructured params need `= {}`** if the argument might be omitted.
4. **`dataset` values are always strings.**
5. **`innerHTML` doesn't escape** — use `textContent` for anything user-supplied.
6. **`.toFixed()` returns a string**, not a number.
7. **`dateA - dateB` works; `dateA + dateB` doesn't.**
