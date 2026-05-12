const app = require('./server');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`tasks api listening on http://localhost:${PORT}`);
  });
}
