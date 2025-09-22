import { runPythonBatch } from '../src/pythonExecutor';

/* eslint-disable no-console */

async function main() {
  const results = await runPythonBatch(
    "n = int(input())\nprint(n * 2)",
    [
      { stdin: '2\n', expectedStdout: '4\n' },
      { stdin: '5\n', expectedStdout: '10\n' },
    ],
  );

  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
