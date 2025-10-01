import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Progress, Row, Col, Typography, Skeleton } from "antd";
import { useProgressStore } from "../../stores/progress";

const { Title, Paragraph } = Typography;

export default function HubPage() {
  const { snapshot, loading, fetchHome } = useProgressStore();

  useEffect(() => {
    if (!snapshot) {
      fetchHome("stu_1").catch((error) => {
        console.error("Failed to load hub data", error);
      });
    }
  }, [snapshot, fetchHome]);

  if (loading || !snapshot) {
    return <Skeleton active paragraph={{ rows: 4 }} style={{ padding: "2rem" }} />;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: "2rem" }}>
        课程地图
      </Title>
      <Row gutter={[16, 16]}>
        {snapshot.packages.map((pkg) => (
          <Col span={8} key={pkg.pkgId}>
            <Link to={`/packages/${pkg.pkgId}`}>
              <Card hoverable>
                <Title level={4}>{pkg.title}</Title>
                <Paragraph type="secondary">
                  {pkg.completed} / {pkg.total} 关卡
                </Paragraph>
                <Progress percent={Math.round(pkg.percent * 100)} />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
