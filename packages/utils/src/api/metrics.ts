import ky from 'ky';

// This would ideally be a shared ky instance
const api = ky.create({ prefixUrl: '/api' });

export type Dim = 'study_minutes' | 'levels_completed' | 'retry_count' | 'accuracy';
export type Period = 'daily' | 'weekly';

export async function getStudentTrend(
  studentId: string,
  dims: Dim[],
  period: Period,
  from?: string,
  to?: string
) {
  const q = new URLSearchParams({ dims: dims.join(','), period, from: from || '', to: to || '' });
  
  // Using mock data that matches the expected API response structure
  const data = {
    series: dims.map(dim => ({
      dim,
      points: Array.from({ length: 8 }, (_, i) => ({
        t: new Date(Date.now() - (7 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        v: Math.random() * 100, // Mock value
      }))
    }))
  };

  // Normalization logic from the spec
  const index: Record<string, any> = {};
  for (const s of data.series) {
    for (const p of s.points) {
      const key = p.t;
      index[key] = index[key] || { t: new Date(p.t) };
      index[key][s.dim] = p.v;
    }
  }
  return Object.values(index).sort((a, b) => a.t.getTime() - b.t.getTime());
}

export async function postClassCompare(
  classId: string,
  dims: Dim[],
  period: Period,
  bucketISO: string
) {
  // Mock data that matches the expected API response structure
  const data = {
    rows: Array.from({ length: 10 }, (_, i) => ({
      studentId: `stu_${i}`,
      name: `Student ${i + 1}`,
      ...dims.reduce((acc, dim) => ({ ...acc, [dim]: Math.random() }), {}),
    }))
  };

  return data.rows;
}
