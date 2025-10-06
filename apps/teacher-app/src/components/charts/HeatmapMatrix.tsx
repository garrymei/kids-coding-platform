import './HeatmapMatrix.css'; // We will create this CSS file next

interface HeatmapProps {
  rows: any[]; // e.g., [{ studentId, name, accuracy, ... }]
  columns: string[]; // e.g., ['accuracy', 'retry_count']
  // A function to get the color for a cell based on its value and column
  getColor: (value: number, column: string) => string;
}

export function HeatmapMatrix({ rows, columns, getColor }: HeatmapProps) {
  return (
    <div className="heatmap-matrix">
      <table>
        <thead>
          <tr>
            <th>Student</th>
            {columns.map(col => <th key={col}>{col.replace('_', ' ')}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.studentId}>
              <td>{row.name}</td>
              {columns.map(col => (
                <td key={col}>
                  <div 
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(row[col], col) }}
                  >
                    <span className="cell-value">{row[col].toFixed(2)}</span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


