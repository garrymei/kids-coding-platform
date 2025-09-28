import React, { useEffect } from 'react';
import { List, Spin, Card } from 'antd';
import { useStudentClassStore } from '../stores/class';

export function MyClassesPage() {
  const { myClasses, loading, error, fetchMyClasses } = useStudentClassStore();

  useEffect(() => {
    fetchMyClasses();
  }, [fetchMyClasses]);

  if (loading) {
    return <Spin tip="Loading..."><div style={{ height: 200 }} /></Spin>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Classes</h1>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={myClasses}
        renderItem={item => (
          <List.Item>
            <Card title={item.name}>
              <p>{item.description}</p>
              <p><strong>Teacher:</strong> {item.teacherName}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
