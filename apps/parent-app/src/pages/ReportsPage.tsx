import { Card, Badge, Button } from '@kids/ui-kit';

export function ReportsPage() {
  return (
    <div className="page-section">
      <div className="page-section__header">
        <h2>学习报告</h2>
        <Button variant="secondary">导出 PDF</Button>
      </div>
      <Card heading="本周亮点">
        <ul className="reminder-list">
          <li>✅ 完成 Blockly 逻辑闯关，正确率 92%。</li>
          <li>📝 Python 练习提交 4 次，老师给出 2 条表扬点评。</li>
        </ul>
      </Card>
      <Card heading="能力雷达">
        <p>雷达图待接入数据源，占位展示评分：</p>
        <div className="quick-actions">
          <Badge text="逻辑" tone="success" />
          <Badge text="创意" tone="info" />
          <Badge text="坚持" tone="warning" />
        </div>
      </Card>
    </div>
  );
}
