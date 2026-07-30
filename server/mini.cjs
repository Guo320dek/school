const http = require('http');
const PORT = parseInt(process.env.PORT, 10) || 3001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', url: req.url }));
});

server.listen(PORT, () => {
  console.log('Minimal server on', PORT);
});
