import { Badge, Card, Button } from '@kids/ui-kit';

export function AssignmentsPage() {
  return (
    <div className="page-section">
      <div className="page-section__header">
        <h2>待批改</h2>
        <Badge text="8 待处理" tone="warning" />
      </div>
      <Card heading="Blockly 逻辑闯关 · 第 4 关">
        <p>共收到 18 份学生提交，建议重点关注进度落后的同学。</p>
        <div className="course-card__actions">
          <Button variant="primary">进入批改</Button>
          <Button variant="ghost">查看提示</Button>
        </div>
      </Card>
      <Card heading="项目作业 · 我的小游戏">
        <p>请在周五前完成点评，并挑选 3 份作品展示。</p>
        <div className="course-card__actions">
          <Button variant="secondary">查看作品</Button>
          <Button variant="ghost">发送提醒</Button>
        </div>
      </Card>
    </div>
  );
}
