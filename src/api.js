// src/api.js

// fragments microservice API, defaults to localhost:8080
const apiUrl = process.env.API_URL || 'http://localhost:8080';

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user, expand) {
  console.log('Requesting user fragments data...');
  let baseUrl = `${apiUrl}/v1/fragments`;
  if (expand) baseUrl += `?expand=${expand}`;

  try {
    const res = await fetch(baseUrl, {
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });

    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

export async function getUserFragmentById(user, id) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const type = res.headers.get('Content-Type');

    if (type && type.includes('application/json')) {
      console.log('Response is JSON');
      const data = await res.json();
      const safeData = JSON.parse(JSON.stringify(data, null, 2));
      return safeData;
    } else if (type && type.includes('text/plain')) {
      console.log('Response is text');
      const data = await res.text();
      return data;
    }
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

export async function postFragment(user, contentType, value) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: user.authorizationHeaders().Authorization,
      },
      body: value,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Unable to call POST /v1/fragment', { err: err.message });
  }
}
