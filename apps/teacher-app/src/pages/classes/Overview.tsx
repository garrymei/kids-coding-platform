import { useState, useEffect, useMemo } from 'react';
import { useMetricsStore } from '../../stores/metrics';
import { HeatmapMatrix } from '../../components/charts/HeatmapMatrix';
import type { Dim, Period } from '@kids/utils';
import { Card, Skeleton } from 'antd';
const classId = 'class_1'; // Mock classId

// Simple quantile color scale function
function getQuantileColor(value: number, quantileThresholds: number[]) {
  const colors = ['#fee2e2', '#fecaca', '#a7f3d0', '#6ee7b7', '#34d399']; // Red to Green
  if (value <= quantileThresholds[0]) return colors[0];
  if (value <= quantileThresholds[1]) return colors[1];
  if (value <= quantileThresholds[2]) return colors[2];
  if (value <= quantileThresholds[3]) return colors[3];
  return colors[4];
}

export function OverviewPage() {
  // const navigate = useNavigate();
  const { compareRows, compareLoading, fetchCompare } = useMetricsStore();
  const [dimensions, _setDimensions] = useState<Dim[]>(['accuracy', 'retry_count', 'levels_completed']);
  const [period, _setPeriod] = useState<Period>('weekly');

  useEffect(() => {
    // Fetch data for the current week
    fetchCompare(classId, dimensions, period, new Date().toISOString());
  }, [dimensions, period, fetchCompare]);

  const quantileThresholds = useMemo(() => {
    const thresholds: Record<string, number[]> = {};
    for (const dim of dimensions) {
      const values = compareRows.map(row => row[dim] as number).sort((a, b) => a - b);
      if (values.length < 5) {
        thresholds[dim] = [0.2, 0.4, 0.6, 0.8].map(p => values[Math.floor(p * (values.length-1))]);
      } else {
        thresholds[dim] = [0.2, 0.4, 0.6, 0.8].map(p => values[Math.floor(p * values.length)]);
      }
    }
    return thresholds;
  }, [compareRows, dimensions]);

  // const _handleCellClick = (studentId: string, dimension: Dim) => {
  //   navigate(`/classes/students/${studentId}/trend?dim=${dimension}`);
  // };

  const getColorForCell = (value: number, column: string) => {
    return getQuantileColor(value, quantileThresholds[column] || []);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Card style={{ marginBottom: '2rem' }}>
        {/* Controls would go here */}
        <p>Displaying weekly comparison for class: {classId}</p>
      </Card>

      {compareLoading ? (
        <Skeleton active />
      ) : (
        <Card title="Class Heatmap Overview">
          <HeatmapMatrix 
            rows={compareRows}
            columns={dimensions}
            getColor={getColorForCell}
          />
        </Card>
      )}
    </div>
  );
}
