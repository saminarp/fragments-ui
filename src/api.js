// fragments microservice API, defaults to localhost:8080
const apiUrl = process.env.API_URL || 'http://localhost:8080';

export async function getUserFragments(user, expand) {
  console.log('Requesting user fragments data...');
  try {
    let url = `${apiUrl}/v1/fragments`;
    if (expand) url += '?expand=1';

    const res = await fetch(url, {
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
    console.error('Unable to call GET /v1/fragments', { err });
  }
}

export async function getFragmentById(user, id, ext = '') {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}${ext}`, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const contentType = res.headers.get('Content-Type');
    const type = contentType?.split(';')[0];

    switch (type) {
      case 'text/plain':
        return await res.text();
      case 'text/html':
        return await res.text();
      case 'text/markdown':
        return await res.text();
      case 'application/json':
        return { fragment: await res.json() };
      case 'image/png':
        const blobpng = await res.blob();
        const url = URL.createObjectURL(blobpng);
        return url;
      case 'image/jpeg':
        const blobjepeg = await res.blob();
        const url2 = URL.createObjectURL(blobjepeg);
        return url2;
      case 'image/gif':
        const blobgif = await res.blob();
        const url3 = URL.createObjectURL(blobgif);
        return url3;
      case 'image/webp':
        const blobwebp = await res.blob();
        const url4 = URL.createObjectURL(blobwebp);
        return url4;

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }
  } catch (err) {
    console.error('Unable to call GET /v1/fragments/:id', { err });
    return null;
  }
}

export async function getFragmentInfo(user, id) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}/info`, {
      Authorization: user.authorizationHeaders().Authorization,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  } catch (err) {
    console.error(`Unable to call GET /v1/fragments/${id}`, { err });
  }
}

export async function postFragment(user, fragment, type) {
  console.log('Posting user fragment data...');

  try {
    if (type == 'application/json') {
      fragment = JSON.parse(JSON.stringify(fragment).replace(/\\n/g, '').replace(/ /g, ''));
    }
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: {
        'Content-Type': type,
        Authorization: user.authorizationHeaders().Authorization,
      },
      body: fragment,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    console.log('User fragment data posted', { fragment });
  } catch (err) {
    console.error('Unable to call POST /v1/fragment', { err });
  }
}

export async function deleteFragment(user, id) {
  console.log('Deleting user fragment...');

  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: user.authorizationHeaders().Authorization,
      },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    console.log('Deleted fragment ' + id);
  } catch (err) {
    console.error(`Unable to call DELETE /v1/fragment/${id}`, { err });
  }
}

export async function updateFragment(user, id, fragment, type) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': type,
        Authorization: user.authorizationHeaders().Authorization,
      },
      body: fragment,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    console.log('Updated fragment data', { fragments: await res.json() });
  } catch (err) {
    console.error('Unable to call PUT /v1/fragment', { err: err.message });
    throw new Error('Unable to call PUT /v1/fragment');
  }
}
