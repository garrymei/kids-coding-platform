import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { List, Typography, Skeleton, Tag } from "antd";
import { CheckCircleFilled, SyncOutlined, LockFilled } from "@ant-design/icons";
import { useProgressStore } from "../stores/progress";

const { Title } = Typography;

const STATUS_ICON_MAP = {
  done: <CheckCircleFilled style={{ color: "#16a34a" }} />,
  in_progress: <SyncOutlined spin style={{ color: "#2563eb" }} />,
  locked: <LockFilled style={{ color: "#9ca3af" }} />,
} as const;

type StatusKey = keyof typeof STATUS_ICON_MAP;

export default function PackagePage() {
  const { pkgId } = useParams<{ pkgId: string }>();
  const { pkgCache, fetchPackage, loading } = useProgressStore();
  const packageDetails = pkgId ? pkgCache[pkgId] : null;

  useEffect(() => {
    if (pkgId) {
      fetchPackage("stu_1", pkgId).catch((error) => {
        console.error("Failed to load package", error);
      });
    }
  }, [pkgId, fetchPackage]);

  if (loading || !packageDetails) {
    return <Skeleton active paragraph={{ rows: 5 }} style={{ padding: "2rem" }} />;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2} style={{ marginBottom: "2rem" }}>
        课程包：{pkgId}
      </Title>
      <List
        itemLayout="horizontal"
        dataSource={packageDetails.levels}
        renderItem={(level) => (
          <List.Item>
            <List.Item.Meta
              avatar={STATUS_ICON_MAP[level.status as StatusKey]}
              title={<Link to={`/play/${level.levelId}`}>{level.levelId}</Link>}
            />
            <Tag>{level.status}</Tag>
          </List.Item>
        )}
      />
    </div>
  );
}
