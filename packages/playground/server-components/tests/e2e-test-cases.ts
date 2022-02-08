import fetch from 'node-fetch';

type TestOptions = {
  getServerUrl: () => string;
  isWorker?: boolean;
  isBuild?: boolean;
};

export default async function testCases({getServerUrl}: TestOptions) {
  it('shows the homepage, navigates to about, and increases the count', async () => {
    await page.goto(getServerUrl());

    expect(await page.textContent('h1')).toContain('Home');
    const secretsServer = await page.textContent('.secrets-server');
    expect(secretsServer).toContain('PUBLIC_VARIABLE:42-public|');
    expect(secretsServer).toContain('PRIVATE_VARIABLE:42-private|');
    const secretsClient = await page.textContent('.secrets-client');
    expect(secretsClient).toContain('PUBLIC_VARIABLE:42-public|');
    expect(secretsClient).toContain('PRIVATE_VARIABLE:|'); // Missing private var in client bundle

    await page.click('.btn');

    expect(await page.textContent('body')).toContain('About');
    expect(await page.textContent('.count')).toBe('Count is 0');

    await page.click('.increase');
    expect(await page.textContent('.count')).toBe('Count is 1');
  });

  it('renders `<ShopifyProvider>` dynamically in RSC and on the client', async () => {
    // "someDynamicValue should get injected into the response config paylout"
    await page.goto(getServerUrl() + '/config/someDynamicValue');

    expect(await page.textContent('#root > div')).toContain(
      '{"locale":"en-us","storeDomain":"someDynamicValue-domain","storefrontToken":"someDynamicValue-token","storefrontApiVersion":"someDynamicValue-version"}'
    );
  });

  it('follows synchronous redirects', async () => {
    await page.goto(getServerUrl() + '/redirected');
    expect(await page.url()).toContain('/about');
    expect(await page.textContent('h1')).toContain('About');
  });

  it('should support API route on a server component for POST methods', async () => {
    const response = await page.request.post(getServerUrl() + '/', {
      headers: {
        Accept: 'text/plain',
      },
    });
    const text = await response.text();

    expect(response.status()).toBe(200);
    expect(text).toEqual('some api response');
  });

  it('should support API route on a server component for PUT methods', async () => {
    const response = await page.request.put(getServerUrl() + '/', {
      headers: {
        Accept: 'text/plain',
      },
    });
    const text = await response.text();

    expect(response.status()).toBe(200);
    expect(text).toEqual('some api response');
  });

  it('should support API route on a server component for PATCH methods', async () => {
    const response = await page.request.patch(getServerUrl() + '/', {
      headers: {
        Accept: 'text/plain',
      },
    });
    const text = await response.text();

    expect(response.status()).toBe(200);
    expect(text).toEqual('some api response');
  });

  it('should support API route on a server component for DELETE methods', async () => {
    const response = await page.request.delete(getServerUrl() + '/', {
      headers: {
        Accept: 'text/plain',
      },
    });
    const text = await response.text();

    expect(response.status()).toBe(200);
    expect(text).toEqual('some api response');
  });

  it('should support API route on a server component for HEAD methods', async () => {
    const response = await page.request.head(getServerUrl() + '/', {
      headers: {
        Accept: 'text/plain',
      },
    });
    const text = await response.text();

    expect(response.status()).toBe(200);
  });

  it('should GET data from an API route', async () => {
    const response = await page.request.get(getServerUrl() + '/comments', {
      headers: {
        Accept: 'application/json',
      },
    });
    const json = await response.json();

    expect(response.status()).toBe(200);
    expect(json).toEqual([{id: 0, value: 'some comment'}]);
  });

  it('should GET by a route parameter', async () => {
    const response = await page.request.get(getServerUrl() + '/comments/0', {
      headers: {
        Accept: 'application/json',
      },
    });
    const json = await response.json();

    expect(response.status()).toBe(200);
    expect(json).toEqual({id: 0, value: 'some comment'});
  });

  it('should POST data to an API route', async () => {
    const response = await page.request.post(getServerUrl() + '/comments', {
      data: JSON.stringify({
        value: 'new comment',
      }),
      headers: {
        Accept: 'application/json',
      },
    });
    const json = await response.json();

    expect(response.status()).toBe(200);
    expect(json).toEqual({id: 1, value: 'new comment'});
  });

  it('should DELETE an API route', async () => {
    const response = await page.request.delete(getServerUrl() + '/comments', {
      headers: {
        Accept: 'application/json',
      },
    });
    expect(response.status()).toBe(204);
    expect(response.statusText()).toBe('No Content');
  });

  it('should return 404 on unknown method', async () => {
    const response = await page.request.patch(getServerUrl() + '/comments', {
      data: JSON.stringify({}),
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    expect(response.status()).toBe(405);
    expect(response.statusText()).toBe('Method Not Allowed');
    expect(text).toBe('Comment method not found');
  });

  it('should support simple strings returned from API routes', async () => {
    const response = await page.request.get(getServerUrl() + '/string');
    const text = await response.text();

    expect(response.status()).toBe(200);
    expect(text).toBe('some string');
  });

  it('should support objects as json returned from API routes', async () => {
    const response = await page.request.get(getServerUrl() + '/json');
    const json = await response.json();

    expect(response.status()).toBe(200);
    expect(json).toEqual({some: 'json'});
  });

  it.skip('supports form request on API routes', async () => {
    await page.goto(getServerUrl() + '/form');
    await page.type('#fname', 'sometext');
    await page.click('#fsubmit');
    expect(await page.textContent('*')).toContain('fname=sometext');
  });

  it('should render server state in client component', async () => {
    await page.goto(getServerUrl() + '/test-server-state');
    expect(await page.textContent('h1')).toContain('Test Server State');
    expect(await page.textContent('#server-state')).toContain(
      'Pathname: /test-server-state'
    );
  });

  it('streams the SSR response and includes RSC payload', async () => {
    const response = await fetch(getServerUrl() + '/stream');
    let streamedChunks = [];

    // This fetch response is not standard but a node-fetch polyfill.
    // Therefore, the body is not a ReadableStream but a Node Readable.
    // @ts-ignore
    for await (const chunk of response.body) {
      streamedChunks.push(chunk.toString());
    }

    expect(streamedChunks.length).toBeGreaterThan(1); // Streamed more than 1 chunk

    const body = streamedChunks.join('');
    expect(body).toContain('var __flight=[];');
    expect(body).toContain('__flight.push(`S1:"react.suspense"');
    expect(body).toContain('<div c="5">');
    expect(body).toContain('>footer!<');
  });

  it('buffers HTML for bots', async () => {
    const response = await fetch(getServerUrl() + '/stream?_bot');
    let streamedChunks = [];

    // This fetch response is not standard but a node-fetch polyfill.
    // Therefore, the body is not a ReadableStream but a Node Readable.
    // @ts-ignore
    for await (const chunk of response.body) {
      streamedChunks.push(chunk.toString());
    }

    expect(streamedChunks.length).toEqual(1); // Did not stream because it's a bot

    const body = streamedChunks.join('');
    expect(body).toContain('var __flight=[];');
    expect(body).not.toContain('__flight.push(`S1:"react.suspense"'); // We're not including RSC
    expect(body).toContain('<div c="5">');
    expect(body).toContain('>footer!<');
  });

  it('streams the RSC response', async () => {
    const response = await fetch(
      getServerUrl() +
        '/react?state=' +
        encodeURIComponent(JSON.stringify({pathname: '/stream'}))
    );
    let streamedChunks = [];

    // This fetch response is not standard but a node-fetch polyfill.
    // Therefore, the body is not a ReadableStream but a Node Readable.
    // @ts-ignore
    for await (const chunk of response.body) {
      streamedChunks.push(chunk.toString());
    }

    expect(streamedChunks.length).toBeGreaterThan(1);

    const body = streamedChunks.join('');
    expect(body).toContain('S1:"react.suspense"');
    expect(body).toContain('"c":"5","children":"done"');
  });

  it('shows SEO tags for bots', async () => {
    const response = await fetch(getServerUrl() + '/seo?_bot');
    const body = await response.text();

    expect(body).toContain('<html lang="ja"');
    expect(body).toContain('<body data-test="true"');
    expect(body).toMatch(
      /<meta\s+.*?property="og:url"\s+content="example.com"\s*\/>/
    );
    // This one comes after Suspense delay
    expect(body).toMatch(
      /<meta\s+.*?property="type"\s+content="website"\s*\/>/
    );
  });
}