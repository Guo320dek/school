import { useState, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, Input, Space, Tag, Card, Row, Col, Statistic, Typography, message, Badge, Tooltip, Avatar, List } from 'antd';
import {
  PlusOutlined, SearchOutlined, UserOutlined, SafetyCertificateOutlined,
  EnvironmentOutlined, WarningOutlined, TeamOutlined, BankOutlined,
  FilterOutlined, ClearOutlined, PhoneOutlined, CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockStaff } from '../../mock/data';
import type { Staff } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = { '在职': 'green', '离职': 'orange', '退休': 'blue' };
const deptMeta: Record<string, { color: string; icon: React.ReactNode; desc: string }> = {
  '教务处': { color: '#5B8DEF', icon: <SafetyCertificateOutlined />, desc: '教务管理' },
  '德育处': { color: '#722ED1', icon: <UserOutlined />, desc: '学生德育' },
  '年级组': { color: '#13C2C2', icon: <TeamOutlined />, desc: '一线教师' },
  '后勤处': { color: '#FAAD14', icon: <EnvironmentOutlined />, desc: '后勤保障' },
  '校办':   { color: '#EB2F96', icon: <BankOutlined />, desc: '行政办公' },
};

function genId() { return String(Date.now()) + Math.random().toString(36).slice(2, 6); }

export default function StaffArchive() {
  const [staff, setStaff] = useState<Staff[]>([...mockStaff]);
  const [search, setSearch] = useState('');
  const [activeDept, setActiveDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('在职');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form] = Form.useForm();

  const departments = useMemo(() => [...new Set(staff.map((s) => s.department))].sort(), [staff]);

  const filtered = useMemo(() => staff.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.includes(q) && !s.staffNo.toLowerCase().includes(q) &&
          !s.position.includes(q) && !s.title.includes(q) && !s.major.includes(q)) return false;
    }
    if (activeDept !== 'all' && s.department !== activeDept) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  }), [staff, search, activeDept, filterStatus]);

  const deptStats = useMemo(() => {
    return departments.map((d) => ({
      dept: d,
      total: staff.filter((s) => s.department === d).length,
      active: staff.filter((s) => s.department === d && s.status === '在职').length,
    }));
  }, [staff, departments]);

  const expiringSoon = useMemo(() => staff.filter((s) => {
    if (s.status !== '在职') return false;
    const days = dayjs(s.contractEnd).diff(dayjs(), 'day');
    return days >= 0 && days <= 30;
  }), [staff]);

  function openAdd() { setEditing(null); form.resetFields(); setModalOpen(true); }
  function openEdit(r: Staff) { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }
  function handleDelete(id: string) { setStaff((p) => p.filter((s) => s.id !== id)); message.success('已删除'); }

  function handleSave() {
    form.validateFields().then((v) => {
      if (editing) {
        setStaff((p) => p.map((s) => s.id === editing.id ? { ...s, ...v } : s));
        message.success('已更新');
      } else {
        setStaff((p) => [{ id: genId(), ...v }, ...p]);
        message.success('已添加');
      }
      setModalOpen(false);
    });
  }

  const columns: ColumnsType<Staff> = [
    {
      title: '姓名', dataIndex: 'name', width: 100, fixed: 'left',
      render: (name: string, r) => (
        <Space size={8}>
          <Avatar size={30} style={{ background: r.status === '在职' ? deptMeta[r.department]?.color ?? '#5B8DEF' : '#d9d9d9', fontSize: 13 }}>
            {name[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{name}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{r.staffNo}</div>
          </div>
          {r.status !== '在职' && <Tag color={statusColor[r.status]} style={{ fontSize: 10, marginLeft: 4 }}>{r.status}</Tag>}
        </Space>
      ),
    },
    {
      title: '部门', dataIndex: 'department', width: 85,
      render: (d: string) => <Tag color={deptMeta[d]?.color} bordered={false} style={{ borderRadius: 4 }}>{d}</Tag>,
    },
    { title: '岗位', dataIndex: 'position', width: 90, render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text> },
    {
      title: '职称/学历', width: 120,
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 13 }}>{r.title || '--'}</Text>
          <div style={{ fontSize: 11, color: '#999' }}>{r.education} · {r.major}</div>
        </div>
      ),
    },
    {
      title: '入职', dataIndex: 'hireDate', width: 85, sorter: (a, b) => a.hireDate.localeCompare(b.hireDate),
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '合同到期', width: 105,
      render: (_, r) => {
        if (r.status !== '在职') return <Text type="secondary" style={{ fontSize: 12 }}>{r.contractEnd}</Text>;
        const days = dayjs(r.contractEnd).diff(dayjs(), 'day');
        const urgent = days <= 30;
        return (
          <Space size={4}>
            <span style={{ color: urgent ? '#faad14' : undefined, fontWeight: urgent ? 500 : undefined, fontSize: 12 }}>{r.contractEnd}</span>
            {urgent && <Tooltip title={`${days}天后到期`}><Badge status="warning" /></Tooltip>}
          </Space>
        );
      },
    },
    {
      title: '操作', width: 100, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <a onClick={() => openEdit(r)} style={{ fontSize: 13 }}>编辑</a>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#ff4d4f', fontSize: 13 }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>职工档案</Title>

      {/* 部门卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card
            size="small" hoverable
            style={{
              borderRadius: 10, textAlign: 'center', cursor: 'pointer',
              borderColor: activeDept === 'all' ? '#5B8DEF' : '#f0f0f0',
              borderWidth: activeDept === 'all' ? 2 : 1,
              background: activeDept === 'all' ? '#F0F5FF' : '#fff',
            }}
            onClick={() => { setActiveDept('all'); }}
          >
            <Statistic
              title={<span style={{ fontSize: 12 }}>全部职工</span>}
              value={staff.filter((s) => s.status === '在职').length}
              suffix={`/ ${staff.length}`}
              valueStyle={{ fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        {deptStats.map((ds) => (
          <Col xs={12} sm={8} md={6} lg={4} key={ds.dept}>
            <Card
              size="small" hoverable
              style={{
                borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                borderColor: activeDept === ds.dept ? deptMeta[ds.dept]?.color : '#f0f0f0',
                borderWidth: activeDept === ds.dept ? 2 : 1,
              }}
              onClick={() => setActiveDept(activeDept === ds.dept ? 'all' : ds.dept)}
            >
              <div style={{ fontSize: 22, color: deptMeta[ds.dept]?.color, marginBottom: 4 }}>
                {deptMeta[ds.dept]?.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{ds.dept}</div>
              <Text style={{ fontSize: 22, fontWeight: 600, color: deptMeta[ds.dept]?.color }}>{ds.active}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}> / {ds.total} 人</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 搜索栏 */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 10, background: '#FAFBFC' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Input
              placeholder="搜索姓名、工号、岗位、职称、专业..."
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={search} onChange={(e) => setSearch(e.target.value)} allowClear
              style={{ width: 340 }}
              suffix={
                search ? <ClearOutlined onClick={() => setSearch('')} style={{ cursor: 'pointer', color: '#bbb' }} /> : undefined
              }
            />
          </Col>
          <Col>
            <Space>
              <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 100 }} size="small"
                options={[{ label: '在职', value: '在职' }, { label: '离职', value: '离职' }, { label: '退休', value: '退休' }, { label: '全部状态', value: '' }]} />
              {expiringSoon.length > 0 && (
                <Tooltip title={`${expiringSoon.length} 人合同即将到期`}>
                  <Tag color="warning" style={{ cursor: 'pointer' }} onClick={() => { setActiveDept('all'); setFilterStatus('在职'); }}>
                    <WarningOutlined /> 合同预警 {expiringSoon.length}
                  </Tag>
                </Tooltip>
              )}
              <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openAdd}>添加职工</Button>
            </Space>
          </Col>
        </Row>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {activeDept !== 'all' && <Tag closable color={deptMeta[activeDept]?.color} onClose={() => setActiveDept('all')} style={{ marginRight: 8 }}>{activeDept}</Tag>}
            显示 {filtered.length} / {staff.length} 人
          </Text>
        </div>
      </Card>

      {/* 表格 */}
      <Table
        rowKey="id" columns={columns} dataSource={filtered}
        pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 人`, showSizeChanger: true, pageSizeOptions: ['10', '15', '20', '50'] }}
        scroll={{ x: 750 }} size="middle"
        expandable={{
          expandedRowRender: (r) => (
            <Row gutter={[24, 6]} style={{ padding: '8px 0' }}>
              <Col span={8}><Text type="secondary">电话：</Text>{r.phone}</Col>
              <Col span={8}><Text type="secondary">合同：</Text>{r.contractStart} ~ {r.contractEnd}</Col>
              <Col span={8}><Text type="secondary">备注：</Text>{r.remark || '无'}</Col>
            </Row>
          ),
        }}
      />

      {/* 弹窗 */}
      <Modal title={editing ? '编辑职工信息' : '添加职工'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="staffNo" label="工号" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="department" label="部门" rules={[{ required: true }]}>
              <Select options={Object.keys(deptMeta).map((v) => ({ label: v, value: v }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="position" label="岗位" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="title" label="职称"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="education" label="学历"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="major" label="专业"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="电话"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="hireDate" label="入职日期" rules={[{ required: true }]}><Input placeholder="2020-09-01" /></Form.Item></Col>
            <Col span={8}><Form.Item name="contractStart" label="合同开始"><Input placeholder="2024-09-01" /></Form.Item></Col>
            <Col span={8}><Form.Item name="contractEnd" label="合同结束"><Input placeholder="2027-08-31" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select options={[{ label: '在职', value: '在职' }, { label: '离职', value: '离职' }, { label: '退休', value: '退休' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="remark" label="备注"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
