import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Popconfirm, Input, Select, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getSubjects, createSubject, updateSubject, deleteSubject, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import { newId } from '../../utils/id';
import type { Subject, Staff } from '../../types';

const { Title, Text } = Typography;

const catColors: Record<string, string> = { '主科': 'red', '选考': 'blue', '学考': 'green', '艺体': 'gold', '其他': 'default' };
const catOptions = ['主科', '选考', '学考', '艺体', '其他'];

export default function SubjectManage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form] = Form.useForm();

  const loadSubjects = () => {
    setLoading(true);
    getSubjects().then((raw: any[]) => {
      const parsed = raw.map((s: any) => ({
        ...s,
        teacherIds: typeof s.teacherIds === 'string' ? JSON.parse(s.teacherIds || '[]') : (s.teacherIds || []),
      }));
      setSubjects(parsed);
    }).catch(() => message.error('加载科目失败')).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubjects();
    getStaff().then(setAllStaff).catch(() => message.error('加载教师失败'));
  }, []);
  useRealtime('subjects', loadSubjects);
  const { editable } = usePermission();

  function openAdd() { setEditing(null); form.resetFields(); setModalOpen(true); }
  function openEdit(r: Subject) { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }
  function handleDelete(id: string) {
    deleteSubject(id).then(loadSubjects).then(() => message.success('已删除')).catch(() => message.error('删除失败'));
  }

  function handleSave() {
    form.validateFields().then((v) => {
      const data = { ...v, teacherIds: JSON.stringify(v.teacherIds || []) };
      if (editing) {
        updateSubject(editing.id, data).then(loadSubjects).then(() => message.success('已更新')).catch(() => message.error('更新失败'));
      } else {
        createSubject({ id: newId(), ...data }).then(loadSubjects).then(() => message.success('已添加')).catch(() => message.error('添加失败'));
      }
      setModalOpen(false);
    });
  }

  const columns: ColumnsType<Subject> = [
    { title: '科目名称', dataIndex: 'name', width: 130, render: (v: string) => <Text strong>{v}</Text> },
    { title: '分类', dataIndex: 'category', width: 100, render: (c: string) => <Tag color={catColors[c]}>{c}</Tag> },
    {
      title: '关联教师', dataIndex: 'teacherIds', width: 320,
      render: (ids: string[]) => (
        <Space wrap size={[4, 4]}>
          {ids.length === 0 ? <Text type="secondary" style={{ fontSize: 12 }}>未配置关联教师</Text> :
            ids.map((tid) => {
              const s = allStaff.find((st) => st.id === tid);
              return <Tag key={tid} style={{ fontSize: 11 }}>{s?.name ?? tid}</Tag>;
            })
          }
        </Space>
      ),
    },
    ...(editable ? [{
      title: '操作', width: 120,
      render: (_: unknown, r: Subject) => (
        <Space size={4}>
          <a onClick={() => openEdit(r)} style={{ fontSize: 13 }}>编辑</a>
          <Popconfirm title="确定删除？关联的课程也会受影响" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#DC2626', fontSize: 13 }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>科目管理</Title>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">共 {subjects.length} 个科目 — 用于课程设置和教师关联</Text>
        {editable && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加科目</Button>}
      </div>
      <Table rowKey="id" columns={columns} dataSource={subjects} loading={loading} pagination={false} size="middle" />
      <Modal
        title={editing ? '编辑科目' : '添加科目'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="科目名称" rules={[{ required: true }]}>
            <Input placeholder="如：物理" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={catOptions.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="teacherIds" label="关联教师" help="选择可教授该科目的教师">
            <Select mode="multiple" showSearch optionFilterProp="label" placeholder="选择教师"
              options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: `${s.name} (${s.department})`, value: s.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
