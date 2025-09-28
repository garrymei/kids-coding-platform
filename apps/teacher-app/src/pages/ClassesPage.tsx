import React, { useState } from 'react';
import { Button, List, Modal, Form, Input, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useClassStore } from '../stores/class';

// Mock data for classes - in a real app, this would come from the store
const mockClasses = [
  { id: 'class_1', name: '七年级A班', code: '6K9JQF' },
  { id: 'class_2', name: 'Python兴趣小组', code: 'AB12CD' },
];

export default function ClassesPage() {
  const { createClass, loading } = useClassStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        form.resetFields();
        createClass(values.name).then(() => {
          setIsModalVisible(false);
          // Here you would typically refetch the list of classes
        });
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Classes</h1>
        <Button type="primary" onClick={showModal}>
          Create New Class
        </Button>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={mockClasses}
        renderItem={item => (
          <List.Item
            actions={[
              <Tag color="blue">Code: {item.code}</Tag>,
              <Link to={`/classes/${item.id}/approvals`}>Manage Approvals</Link>
            ]}
          >
            <List.Item.Meta
              title={item.name}
            />
          </List.Item>
        )}
      />
      <Modal
        title="Create New Class"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" name="form_in_modal">
          <Form.Item
            name="name"
            label="Class Name"
            rules={[{ required: true, message: 'Please input the name of the class!' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
