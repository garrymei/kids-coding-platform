export function judgeEventSeq(expected: { expect: string[] }, actual: { events: string[] }) {
  const a = actual.events || [];
  const b = expected.expect || [];
  if (a.length !== b.length) return { ok: false, diffIndex: Math.min(a.length, b.length) };
  for (let i = 0; i < b.length; i++) {
    if (a[i] !== b[i]) return { ok: false, diffIndex: i };
  }
  return { ok: true };
}