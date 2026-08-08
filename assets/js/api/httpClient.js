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
