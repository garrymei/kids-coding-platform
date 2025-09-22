/* eslint-disable no-console */
import { setTimeout as sleep } from 'node:timers/promises';

const payload = {
  language: 'python',
  source: "import time\nimport sys\nvalue = sys.stdin.readline().strip()\nprint(value)\ntime.sleep(0.5)",
  tests: Array.from({ length: 1 }, (_, idx) => ({ stdin: `${idx + 1}\n`, expectedStdout: `${idx + 1}\n` })),
};

async function fire(index: number) {
  const response = await fetch('http://127.0.0.1:4060/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`request ${index} failed with status ${response.status}`);
  }
  const body = await response.json();
  console.log(`Job ${index}`, body);
}

async function main() {
  const tasks = Array.from({ length: 5 }, async (_, idx) => {
    await sleep(idx * 10);
    await fire(idx + 1);
  });
  await Promise.all(tasks);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
