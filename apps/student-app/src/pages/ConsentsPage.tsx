import { useEffect } from "react";
import { Tabs, List, Avatar, Spin, Button, Space, Popconfirm } from "antd";
import { useConsentStore } from "../stores/consent";

const { TabPane } = Tabs;

type ConsentStatus = "pending" | "approved" | "rejected" | "revoked";

function ConsentList({ status }: { status: ConsentStatus }) {
  const { consents, loading, error, fetchConsents, approveConsent, rejectConsent, revokeConsent } =
    useConsentStore();

  useEffect(() => {
    fetchConsents(status).catch((err) => {
      console.error("Failed to load consents", err);
    });
  }, [status, fetchConsents]);

  const handleApprove = async (id: string) => {
    await approveConsent(id);
    fetchConsents(status);
  };

  const handleReject = async (id: string) => {
    await rejectConsent(id);
    fetchConsents(status);
  };

  const handleRevoke = async (id: string) => {
    await revokeConsent(id);
    fetchConsents(status);
  };

  if (loading) {
    return (
      <Spin tip="加载中...">
        <div style={{ height: 200 }} />
      </Spin>
    );
  }

  if (error) {
    return <p>出错了：{error}</p>;
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={consents}
      renderItem={(item) => (
        <List.Item
          actions={[
            status === "pending" && (
              <Space>
                <Button type="primary" onClick={() => handleApprove(item.id)}>
                  通过
                </Button>
                <Button danger onClick={() => handleReject(item.id)}>
                  拒绝
                </Button>
              </Space>
            ),
            status === "approved" && (
              <Popconfirm
                title="确定要撤销该授权吗？"
                onConfirm={() => handleRevoke(item.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="dashed" danger>
                  撤销
                </Button>
              </Popconfirm>
            ),
          ].filter(Boolean)}
        >
          <List.Item.Meta
            avatar={<Avatar>{item.requesterName ? item.requesterName[0] : "?"}</Avatar>}
            title={item.requesterName}
            description={`备注：${item.note || "无"} ｜ 请求时间：${new Date(item.createdAt).toLocaleDateString()}`}
          />
        </List.Item>
      )}
    />
  );
}

export function ConsentsPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>授权管理</h1>
      <Tabs defaultActiveKey="pending">
        <TabPane tab="待处理" key="pending">
          <ConsentList status="pending" />
        </TabPane>
        <TabPane tab="已通过" key="approved">
          <ConsentList status="approved" />
        </TabPane>
        <TabPane tab="已拒绝" key="rejected">
          <ConsentList status="rejected" />
        </TabPane>
        <TabPane tab="已撤销" key="revoked">
          <ConsentList status="revoked" />
        </TabPane>
      </Tabs>
    </div>
  );
}
