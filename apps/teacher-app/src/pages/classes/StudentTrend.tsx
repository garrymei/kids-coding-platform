import React, { useState, useEffect } from 'react';
import { useMetricsStore } from '../../stores/metrics';
import { LineTimeseries } from '@kids/ui-kit';
import { Dim, Period } from '@kids/utils';
import { Select, Card, Skeleton } from 'antd';
import { useParams, useLocation } from 'react-router-dom';

const { Option } = Select;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function StudentTrendPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const query = useQuery();
  const initialDim = query.get('dim') as Dim || 'study_minutes';

  const { trendSeries, trendLoading, fetchTrend } = useMetricsStore();
  const [dimension, setDimension] = useState<Dim>(initialDim);
  const [period, setPeriod] = useState<Period>('weekly');

  useEffect(() => {
    if (studentId) {
      fetchTrend(studentId, [dimension], period);
    }
  }, [studentId, dimension, period, fetchTrend]);

  return (
    <div style={{ padding: '2rem' }}>
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Trend for Student: {studentId}</h2>
        <label>Dimension: </label>
        <Select value={dimension} onChange={setDimension} style={{ width: 200 }}>
          <Option value="study_minutes">Study Minutes</Option>
          <Option value="levels_completed">Levels Completed</Option>
          <Option value="retry_count">Retry Count</Option>
          <Option value="accuracy">Accuracy</Option>
        </Select>
      </Card>

      {trendLoading ? (
        <Skeleton active />
      ) : (
        <Card title={`${dimension.replace('_', ' ')} Trend`}>
          <LineTimeseries data={trendSeries} dimension={dimension} />
        </Card>
      )}
    </div>
  );
}
