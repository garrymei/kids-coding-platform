const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server running');
});

server.listen(5174, () => {
  console.log('Test server running on port 5174');
});