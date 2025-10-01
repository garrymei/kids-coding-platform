import { useEffect } from "react";
import { List, Spin, Card } from "antd";
import { useStudentClassStore } from "../stores/class";

export function MyClassesPage() {
  const { myClasses, loading, error, fetchMyClasses } = useStudentClassStore();

  useEffect(() => {
    fetchMyClasses().catch((err) => {
      console.error("Failed to load classes", err);
    });
  }, [fetchMyClasses]);

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
    <div style={{ padding: "2rem" }}>
      <h1>我的班级</h1>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={myClasses}
        renderItem={(item) => (
          <List.Item>
            <Card title={item.name}>
              <p>{item.description}</p>
              <p>
                <strong>老师：</strong>
                {item.teacherName}
              </p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
