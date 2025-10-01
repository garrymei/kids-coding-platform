import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Col, Row, Statistic, Progress, List, Tag, Skeleton, Empty, message, Space } from "antd";
import { FireOutlined, StarOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useProgressStore } from "../../stores/progress";

const MOCK_STUDENT_ID = "stu_1";

export default function HomePage() {
  const { snapshot, loading, fetchHome, applyAttempt } = useProgressStore();

  useEffect(() => {
    fetchHome(MOCK_STUDENT_ID).catch((error) => {
      console.error("Failed to load student snapshot", error);
    });
  }, [fetchHome]);

  const handleTestAttempt = (passed: boolean) => {
    const levelId = "loops-2";
    applyAttempt({ levelId, passed });
    message.success(`已模拟一次练习（通过：${passed}），请查看数据变化。`);
  };

  if (loading || !snapshot) {
    return <Skeleton active paragraph={{ rows: 8 }} style={{ padding: "2rem" }} />;
  }

  if (!snapshot.xp && snapshot.recent.length === 0) {
    return (
      <Empty description="还没有开始学习，马上开启第一课吧！" style={{ padding: "4rem" }}>
        <Button type="primary" size="large">
          <Link to={snapshot.nextLesson ? `/play/${snapshot.nextLesson.levelId}` : "/hub/python"}>开始第一堂课</Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="连续学习" value={snapshot.streakDays} prefix={<FireOutlined />} suffix="天" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="累计经验" value={snapshot.xp} prefix={<StarOutlined />} suffix="XP" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="今日学习" value={snapshot.today.studyMinutes} prefix={<ClockCircleOutlined />} suffix="分钟" />
          </Card>
        </Col>
      </Row>

      {snapshot.nextLesson && (
        <Card style={{ marginTop: "2rem" }} title="🚀 继续学习">
          <Row align="middle">
            <Col span={18}>
              <h3>{snapshot.nextLesson.title}</h3>
              <Tag>{snapshot.nextLesson.pkgId}</Tag>
            </Col>
            <Col span={6} style={{ textAlign: "right" }}>
              <Link to={`/play/${snapshot.nextLesson.levelId}`}>
                <Button type="primary" size="large">
                  开始学习
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>
      )}

      <Card style={{ marginTop: "2rem" }} title="课程包进度">
        <div style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
          {snapshot.packages.map((pkg) => (
            <Card key={pkg.pkgId} style={{ minWidth: 250 }}>
              <Progress type="circle" percent={Math.round(pkg.percent * 100)} width={80} />
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <strong>{pkg.title}</strong>
                <p>
                  {pkg.completed} / {pkg.total}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Row gutter={16} style={{ marginTop: "2rem" }}>
        <Col span={12}>
          <Card title="近期活动">
            <List
              dataSource={snapshot.recent}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      item.passed ? <CheckCircleOutlined style={{ color: "#16a34a" }} /> : <CloseCircleOutlined style={{ color: "#ef4444" }} />
                    }
                    title={`关卡：${item.levelId}`}
                    description={new Date(item.ts).toLocaleString()}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="近期成就">
            <List
              dataSource={snapshot.achievements}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<StarOutlined />}
                    title={item.title}
                    description={`获得时间：${item.gainedAt}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="模拟测试 (M6)" style={{ marginTop: "2rem" }}>
        <p>点击按钮模拟一次 loops-2 关卡尝试，可观察经验、今日统计和课程包进度的变化。</p>
        <Space>
          <Button onClick={() => handleTestAttempt(true)}>模拟通过</Button>
          <Button danger onClick={() => handleTestAttempt(false)}>模拟失败</Button>
        </Space>
      </Card>
    </div>
  );
}
