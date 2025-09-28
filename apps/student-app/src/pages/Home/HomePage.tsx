import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProgressStore } from '../../stores/progress';
import { Button, Card, Col, Row, Statistic, Progress, List, Tag, Skeleton, Empty, message, Space } from 'antd';
import { FireOutlined, StarOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const studentId = 'stu_1'; // Mock studentId for fetching data

export default function HomePage() {
  const { snapshot, loading, fetchHome, applyAttempt } = useProgressStore();

  useEffect(() => {
    fetchHome(studentId);
  }, [fetchHome]);

  const handleTestAttempt = (passed: boolean) => {
    const levelId = 'loops-2'; // The level that is currently 'in_progress' in mock data
    applyAttempt({ levelId, passed });
    message.success(`Simulated attempt (passed: ${passed}). Check for optimistic updates.`);
  };

  if (loading || !snapshot) {
    return <Skeleton active paragraph={{ rows: 8 }} style={{ padding: '2rem' }} />;
  }

  if (!snapshot.xp && snapshot.recent.length === 0) {
    return (
      <Empty
        description="You haven't started any lessons yet!"
        style={{ padding: '4rem' }}
      >
        <Button type="primary" size="large">
          <Link to={snapshot.nextLesson ? `/play/${snapshot.nextLesson.levelId}` : '/hub/python'}>
            Start Your First Lesson
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Cards */}
      <Row gutter={16}>
        <Col span={8}><Card><Statistic title="连续学习" value={snapshot.streakDays} prefix={<FireOutlined />} suffix="天" /></Card></Col>
        <Col span={8}><Card><Statistic title="累计经验" value={snapshot.xp} prefix={<StarOutlined />} suffix="XP" /></Card></Col>
        <Col span={8}><Card><Statistic title="今日学习" value={snapshot.today.studyMinutes} prefix={<ClockCircleOutlined />} suffix="分钟" /></Card></Col>
      </Row>

      {/* Quick Start / Next Lesson */}
      {snapshot.nextLesson && (
        <Card style={{ marginTop: '2rem' }} title="🚀 继续学习">
          <Row align="middle">
            <Col span={18}>
              <h3>{snapshot.nextLesson.title}</h3>
              <Tag>{snapshot.nextLesson.pkgId}</Tag>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Link to={`/play/${snapshot.nextLesson.levelId}`}>
                <Button type="primary" size="large">开始学习</Button>
              </Link>
            </Col>
          </Row>
        </Card>
      )}

      {/* Package Progress */}
      <Card style={{ marginTop: '2rem' }} title="课程包进度">
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
          {snapshot.packages.map(pkg => (
            <Card key={pkg.pkgId} style={{ minWidth: 250 }}>
              <Progress type="circle" percent={Math.round(pkg.percent * 100)} width={80} />
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <strong>{pkg.title}</strong>
                <p>{pkg.completed} / {pkg.total}</p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Row gutter={16} style={{ marginTop: '2rem' }}>
        {/* Recent Activity */}
        <Col span={12}>
          <Card title="近期活动">
            <List
              dataSource={snapshot.recent}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.passed ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: 'red' }} />}
                    title={`Attempted: ${item.levelId}`}
                    description={new Date(item.ts).toLocaleString()}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Achievements */}
        <Col span={12}>
          <Card title="近期成就">
            <List
              dataSource={snapshot.achievements}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<StarOutlined />}
                    title={item.title}
                    description={`Gained on: ${item.gainedAt}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Test Section */}
      <Card title="测试功能 (M6)" style={{ marginTop: '2rem' }}>
        <p>点击按钮模拟一次关卡尝试 (level: loops-2)，观察上面的数据变化（XP, 今日统计, 课程包进度等）。</p>
        <Space>
          <Button onClick={() => handleTestAttempt(true)}>模拟通过</Button>
          <Button danger onClick={() => handleTestAttempt(false)}>模拟失败</Button>
        </Space>
      </Card>
    </div>
  );
}
