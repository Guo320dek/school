import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, Input, InputNumber, Space, Tag, Row, Col, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getStudents, createStudent, updateStudent, deleteStudent, getClasses, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import { newId } from '../../utils/id';
import type { Student, ClassInfo, GradeLevel } from '../../types';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = { '在读': '#059669', '休学': '#D97706', '退学': '#DC2626', '毕业': '#888' };
const gradeOptions: GradeLevel[] = ['高一', '高二', '高三'];

export default function StudentRoster() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form] = Form.useForm();

  const loadStudents = () => {
    setLoading(true);
    getStudents().then(setStudents).catch(() => message.error('加载学生数据失败')).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
    getClasses().then(setClasses).catch(() => message.error('加载班级数据失败'));
  }, []);
  useRealtime('students', loadStudents);
  const { editable } = usePermission();

  const activeClasses = useMemo(() =>
    classes.filter((c) => c.status === '在读'),
    [classes]
  );

  const filtered = useMemo(() => students.filter((s) => {
    if (filterGrade !== 'all' && !s.className?.startsWith(filterGrade)) return false;
    if (filterClass !== 'all' && s.classId !== filterClass) return false;
    if (searchText && !s.name.includes(searchText) && !s.studentNo.includes(searchText)) return false;
    return true;
  }), [students, filterGrade, filterClass, searchText]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const g = s.className?.slice(0, 2) ?? '其他';
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [students]);

  function openAdd() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ enrollmentYear: 2024, status: '在读' });
    setModalOpen(true);
  }
  function openEdit(r: Student) { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }
  function handleDelete(id: string) {
    deleteStudent(id).then(loadStudents).then(() => message.success('已删除')).catch(() => message.error('删除失败'));
  }

  function handleSave() {
    form.validateFields().then((v) => {
      const cls = activeClasses.find((c) => c.id === v.classId);
      const data = { ...v, className: cls?.name ?? '' };
      if (editing) {
        updateStudent(editing.id, data).then(loadStudents).then(() => message.success('已更新')).catch(() => message.error('更新失败'));
      } else {
        createStudent({ id: newId(), ...data }).then(loadStudents).then(() => message.success('已添加')).catch(() => message.error('添加失败'));
      }
      setModalOpen(false);
    });
  }

  const columns: ColumnsType<Student> = [
    { title: '学号', dataIndex: 'studentNo', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 100, render: (v: string) => <Text strong>{v}</Text> },
    { title: '性别', dataIndex: 'gender', width: 60 },
    { title: '班级', dataIndex: 'className', width: 130 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (s: string) => <Tag color={statusColor[s]} style={{ borderRadius: 4 }}>{s}</Tag>,
    },
    { title: '入学年份', dataIndex: 'enrollmentYear', width: 90 },
    { title: '电话', dataIndex: 'phone', width: 130, ellipsis: true, render: (v?: string) => v ?? <Text type="secondary">--</Text> },
    { title: '地址', dataIndex: 'address', width: 160, ellipsis: true, render: (v?: string) => v ?? <Text type="secondary">--</Text> },
    ...(editable ? [{
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_: unknown, r: Student) => (
        <Space size={4}>
          <a onClick={() => openEdit(r)} style={{ fontSize: 13 }}>编辑</a>
          <Popconfirm title="确定删除该学生？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#DC2626', fontSize: 13 }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>学生花名册</Title>

      {/* Grade summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {gradeOptions.map((g) => (
          <div
            key={g}
            onClick={() => setFilterGrade(filterGrade === g ? 'all' : g)}
            style={{
              padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
              background: filterGrade === g ? 'rgba(64,98,187,0.08)' : '#fff',
              border: `1px solid ${filterGrade === g ? '#4062BB' : '#E8E2DC'}`,
              transition: 'all 0.15s', minWidth: 120,
            }}
          >
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{g}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4062BB' }}>
              {gradeCounts[g] ?? 0}<span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}> 人</span>
            </div>
          </div>
        ))}
        <div style={{
          padding: '12px 24px', borderRadius: 8, background: '#fff',
          border: '1px solid #E8E2DC', minWidth: 100, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>总计</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#333' }}>
            {students.length}<span style={{ fontSize: 13, fontWeight: 400, color: '#888' }}> 人</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          value={filterClass}
          onChange={setFilterClass}
          style={{ width: 160 }}
          placeholder="选择班级"
          allowClear
          onClear={() => setFilterClass('all')}
          options={[
            { label: '全部班级', value: 'all' },
            ...activeClasses
              .filter((c) => filterGrade === 'all' || c.name.startsWith(filterGrade))
              .map((c) => ({ label: c.name, value: c.id })),
          ]}
        />
        <Input
          placeholder="搜索姓名 / 学号"
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
          共 {filtered.length} 名学生
        </Text>
        {editable && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加学生</Button>}
      </div>

      <Table
        rowKey="id" columns={columns} dataSource={filtered}
        loading={loading} pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 名` }}
        scroll={{ x: 960 }} size="middle"
      />

      <Modal
        title={editing ? '编辑学生' : '添加学生'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input placeholder="如：张三" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                <Select options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="studentNo" label="学号" rules={[{ required: true }]}>
                <Input placeholder="如：2024001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="classId" label="班级" rules={[{ required: true }]}>
                <Select
                  showSearch optionFilterProp="label"
                  options={activeClasses.map((c) => ({ label: c.name, value: c.id }))}
                  placeholder="选择班级"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="如：13812345678" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="家庭地址">
                <Input placeholder="如：青云路18号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="enrollmentYear" label="入学年份" rules={[{ required: true }]}>
                <InputNumber min={2020} max={2030} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={[
                  { label: '在读', value: '在读' }, { label: '休学', value: '休学' },
                  { label: '退学', value: '退学' }, { label: '毕业', value: '毕业' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
