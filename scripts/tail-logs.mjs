#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Usage: node tail-logs.mjs <file> [file...]');
  process.exit(1);
}

const watchers = [];

function printChunk(label, chunk) {
  const normalized = chunk.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  for (const line of lines) {
    if (!line) continue;
    process.stdout.write(`[${label}] ${line}\n`);
  }
}

for (const file of files) {
  const absolute = path.resolve(file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  if (!fs.existsSync(absolute)) {
    fs.writeFileSync(absolute, '');
  }

  const label = path.basename(absolute);
  let position = fs.statSync(absolute).size;

  const emitRange = (start, end) => {
    if (end <= start) return;
    const stream = fs.createReadStream(absolute, {
      encoding: 'utf8',
      start,
      end: end - 1,
    });
    stream.on('data', (chunk) => printChunk(label, chunk));
  };

  emitRange(Math.max(0, position - 4096), position);

  const watcher = () => {
    fs.stat(absolute, (err, stats) => {
      if (err) {
        if (err.code !== 'ENOENT') {
          console.error(`[${label}]`, err.message);
        }
        return;
      }
      if (stats.size > position) {
        emitRange(position, stats.size);
        position = stats.size;
      }
    });
  };

  const interval = setInterval(watcher, 500);
  watchers.push(() => clearInterval(interval));
}

const shutdown = () => {
  for (const cancel of watchers) {
    cancel();
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
