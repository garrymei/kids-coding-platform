import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Dim } from '@kids/utils';

interface LineTimeseriesProps {
  data: any[];
  dimension: Dim;
  colorWeakMode?: boolean;
  reduceMotion?: boolean;
  target?: number;
}

const DIMENSION_CONFIG = {
  study_minutes: { label: 'Study Minutes', unit: 'min', color: '#8884d8', domain: [0, 120] },
  levels_completed: { label: 'Levels Completed', unit: '', color: '#82ca9d', domain: [0, 50] },
  retry_count: { label: 'Retry Count', unit: '', color: '#ffc658', domain: [0, 10] },
  accuracy: { label: 'Accuracy', unit: '%', color: '#ff7300', domain: [0, 1] },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
        <p className="label">{`${new Date(label).toLocaleDateString()}`}</p>
        <p className="intro">{`${payload[0].name} : ${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

export function LineTimeseries({ data, dimension, colorWeakMode = false, reduceMotion = false, target }: LineTimeseriesProps) {
  const config = DIMENSION_CONFIG[dimension] || { label: 'Value', unit: '', color: '#8884d8' };

  const yAxisTickFormatter = (value: number) => {
    if (dimension === 'accuracy') {
      return `${(value * 100).toFixed(0)}%`;
    }
    return String(Math.round(value));
  };

  const lineDot = colorWeakMode ? { strokeWidth: 2 } : true;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="t" 
          tickFormatter={(timeStr) => new Date(timeStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          tickFormatter={yAxisTickFormatter} 
          domain={config.domain as [number, number]} 
          label={{ value: config.label, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey={dimension}
          name={config.label}
          stroke={config.color}
          activeDot={{ r: 8 }}
          dot={lineDot}
          connectNulls={false} // As per spec
          isAnimationActive={!reduceMotion}
        />
        {target !== undefined && (
          <ReferenceLine y={target} label="Target" stroke="red" strokeDasharray="3 3" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
