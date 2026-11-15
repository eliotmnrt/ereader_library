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

  describe('POST /r', () => {
    const postCode = (ebookCode) =>
      fetch(`${baseUrl}/r`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ ebookCode }),
      });

    it('shows the book and a download link for a valid code', async () => {
      const res = await postCode('KXHTRP');
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.match(html, /Demo Book/);
      assert.match(html, /href="\/r\/KXHTRP\/download"/);
    });

    it('accepts lowercase, dash and spaces', async () => {
      const res = await postCode(' kxh-trp ');
      assert.equal(res.status, 200);
      assert.match(await res.text(), /Demo Book/);
    });

    it('returns 404 with the form and an error for an unknown code', async () => {
      const res = await postCode('ZZZZZZ');
      assert.equal(res.status, 404);
      const html = await res.text();
      assert.match(html, /Unknown or expired code/);
      assert.match(html, /<form method="POST" action="\/r">/);
    });

    it('does not echo the submitted value back', async () => {
      const res = await postCode('<script>alert(1)</script>');
      assert.equal(res.status, 404);
      assert.doesNotMatch(await res.text(), /<script>/);
    });

    it('returns 404 when the field is missing', async () => {
      const res = await fetch(`${baseUrl}/r`, { method: 'POST' });
      assert.equal(res.status, 404);
    });
  });

  describe('GET /r/:code/download', () => {
    it('downloads the EPUB with a proper name and type', async () => {
      const res = await fetch(`${baseUrl}/r/KXHTRP/download`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type'), /application\/epub\+zip/);
      assert.match(
        res.headers.get('content-disposition'),
        /^attachment; filename="Jane Doe - Demo Book\.epub"/,
      );
      const body = Buffer.from(await res.arrayBuffer());
      assert.equal(Number(res.headers.get('content-length')), body.length);
      // An EPUB is a zip archive: it starts with the "PK" magic bytes
      assert.equal(body.subarray(0, 2).toString(), 'PK');
    });

    it('accepts a lowercase code in the URL', async () => {
      const res = await fetch(`${baseUrl}/r/kxhtrp/download`);
      assert.equal(res.status, 200);
      await res.arrayBuffer();
    });

    it('returns 404 for an unknown code', async () => {
      const res = await fetch(`${baseUrl}/r/ZZZZZZ/download`);
      assert.equal(res.status, 404);
      assert.match(await res.text(), /Unknown or expired code/);
    });
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
