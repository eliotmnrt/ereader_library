import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/r', (req, res) => {
  res.send(`
    <h1>Ereader Library</h1>
    <form method="POST" action="/r">
      <label for="ebookCode">Ebook code:</label>
      <input id="ebookCode" name="ebookCode" type="text" required>
      <button type="submit">Submit</button>
    </form>
  `);
});

export default app;
