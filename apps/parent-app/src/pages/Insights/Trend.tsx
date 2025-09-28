import React, { useState, useEffect } from 'react';
import { useMetricsStore } from '../../stores/metrics';
import { LineTimeseries } from '@kids/ui-kit';
import { Dim, Period } from '@kids/utils/api/metrics';
import { Select, DatePicker, Card, Statistic, Row, Col, Skeleton } from 'antd';

const { Option } = Select;
const { RangePicker } = DatePicker;

const studentId = 'stu_1'; // Mock studentId

export function TrendPage() {
  const { series, loading, fetchTrend } = useMetricsStore();
  const [dimension, setDimension] = useState<Dim>('study_minutes');
  const [period, setPeriod] = useState<Period>('weekly');

  useEffect(() => {
    fetchTrend(studentId, [dimension], period);
  }, [dimension, period, fetchTrend]);

  const total = series.reduce((acc, item) => acc + (item[dimension] || 0), 0);
  const average = total / (series.length || 1);

  return (
    <div style={{ padding: '2rem' }}>
      <Card style={{ marginBottom: '2rem' }}>
        <Row>
          <Col span={6}>
            <label>Dimension: </label>
            <Select value={dimension} onChange={setDimension} style={{ width: 200 }}>
              <Option value="study_minutes">Study Minutes</Option>
              <Option value="levels_completed">Levels Completed</Option>
              <Option value="retry_count">Retry Count</Option>
              <Option value="accuracy">Accuracy</Option>
            </Select>
          </Col>
          <Col span={6}>
            <label>Period: </label>
            <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Skeleton active />
      ) : (
        <Card title={`${dimension.replace('_', ' ')} Trend`}>
          <LineTimeseries data={series} dimension={dimension} />
        </Card>
      )}

      <Row gutter={16} style={{ marginTop: '2rem' }}>
        <Col span={12}>
          <Card><Statistic title={`Total ${dimension}`} value={total.toFixed(2)} /></Card>
        </Col>
        <Col span={12}>
          <Card><Statistic title={`Average ${dimension}`} value={average.toFixed(2)} /></Card>
        </Col>
      </Row>
    </div>
  );
}
