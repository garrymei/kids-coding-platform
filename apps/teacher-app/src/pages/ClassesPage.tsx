import { useState } from 'react';
import { Button, List, Modal, Form, Input, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { useClassStore } from '../stores/class';

const mockClasses = [
  { id: 'class_1', name: '七年级 A 班', code: '6K9JQF' },
  { id: 'class_2', name: 'Python 兴趣小组', code: 'AB12CD' },
];

export function ClassesPage() {
  const { createClass, loading } = useClassStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
        createClass(values.name).then(() => {
          setIsModalVisible(false);
        });
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>我的班级</h1>
        <Button type="primary" onClick={showModal}>
          新建班级
        </Button>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={mockClasses}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Tag color="blue" key="code">
                邀请码：{item.code}
              </Tag>,
              <Link key="approvals" to={`/classes/${item.id}/approvals`}>
                审批管理
              </Link>,
            ]}
          >
            <List.Item.Meta title={item.name} />
          </List.Item>
        )}
      />
      <Modal
        title="新建班级"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" name="form_in_modal">
          <Form.Item
            name="name"
            label="班级名称"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
