import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('app', () => {
  let server;
  let baseUrl;

  before(() => {
    server = app.listen(0);
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => server.close());

  it('GET / returns Hello, World!', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'Hello, World!');
  });

  it('GET /r returns the ereader page', async () => {
    const res = await fetch(`${baseUrl}/r`);
    assert.equal(res.status, 200);
    assert.equal((await res.text()).includes('Ereader Library'), true);
  });

  it('GET /health returns OK as JSON', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await res.json(), { status: 'OK' });
  });

  it('GET unknown route returns 404', async () => {
    const res = await fetch(`${baseUrl}/nope`);
    assert.equal(res.status, 404);
  });
});
