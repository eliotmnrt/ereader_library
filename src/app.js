import { statSync } from 'node:fs';
import { join } from 'node:path';
import express from 'express';

const ASSETS_DIR = join(import.meta.dirname, '..', 'assets');

const app = express();

app.set('view engine', 'ejs');
app.set('views', join(import.meta.dirname, 'views'));

app.use(express.urlencoded({ extended: false }));

// Demo data until the database exists (brick 6): one hard-coded code -> one book
const DEMO_BOOKS = {
  KXHTRP: { title: 'Demo Book', author: 'Jane Doe', format: 'EPUB', file: join(ASSETS_DIR, 'demo.epub') },
};

// "kxh-trp", " KXH TRP " -> "KXHTRP"
function normalizeCode(input) {
  return String(input ?? '').toUpperCase().replace(/[^A-Z]/g, '');
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// "Jane Doe - Demo Book.epub"
function downloadName(book) {
  return `${book.author} - ${book.title}.${book.format.toLowerCase()}`;
}

function renderUnknownCode(res) {
  // The user's input is never echoed back
  res.status(404).render('r/form', { error: 'Unknown or expired code.' });
}

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/r', (req, res) => {
  res.render('r/form', { error: null });
});

app.post('/r', (req, res) => {
  const code = normalizeCode(req.body?.ebookCode);
  const book = DEMO_BOOKS[code];
  if (!book) return renderUnknownCode(res);

  res.render('r/book', { book, code, size: formatSize(statSync(book.file).size) });
});

app.get('/r/:code/download', (req, res) => {
  const code = normalizeCode(req.params.code);
  const book = DEMO_BOOKS[code];
  if (!book) return renderUnknownCode(res);

  // Sets Content-Disposition: attachment; filename="..." and Content-Type from the extension
  res.download(book.file, downloadName(book));
});

export default app;
