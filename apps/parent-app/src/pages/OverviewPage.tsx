import { Card, Progress, Badge, Button } from '@kids/ui-kit';

export function OverviewPage() {
  return (
    <div className="page-grid">
      <section className="page-grid__column">
        <Card heading="小明 · 学习状态" featured>
          <p>最近 7 天共学习 5 次，保持着良好的节奏 🎯</p>
          <div className="page-grid__stats">
            <div>
              <div className="page-grid__stats-label">总学习时长</div>
              <div className="page-grid__stats-value">6.5 h</div>
            </div>
            <div>
              <div className="page-grid__stats-label">获得经验</div>
              <div className="page-grid__stats-value">+180 XP</div>
            </div>
          </div>
          <div className="page-grid__progress">
            <Progress value={72} label="Python 新手村 · 18/25" />
            <Button variant="secondary">查看详情</Button>
          </div>
        </Card>
      </section>

      <section className="page-grid__column">
        <Card heading="待关注">
          <ul className="reminder-list">
            <li>
              <Badge text="课程提醒" tone="warning" /> 本周编程实验仅完成 2/3 次。
            </li>
            <li>
              <Badge text="成就" tone="success" /> 新徽章“逻辑达人”等待领取。
            </li>
          </ul>
        </Card>
        <Card heading="家庭协同">
          <div className="quick-actions">
            <Button variant="secondary">查看作业</Button>
            <Button variant="secondary">学习计划</Button>
            <Button variant="ghost">老师反馈</Button>
            <Button variant="ghost">设置奖励</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
