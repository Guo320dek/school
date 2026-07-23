import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, Input, InputNumber, Space, Tag, Card, Row, Col, Statistic, Typography, message, Progress, Tabs } from 'antd';
import {
  PlusOutlined, TeamOutlined, HomeOutlined, TrophyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getClasses, createClass, updateClass, deleteClass, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import type { ClassInfo, GradeLevel, SubjectTrack, Staff } from '../../types';

const { Title, Text } = Typography;

const trackOptions: SubjectTrack[] = ['物化生', '物化地', '物生政', '史地政', '史政生', '物化政'];
const trackColors: Record<string, string> = { '物化生': '#5B8DEF', '物化地': '#13C2C2', '物生政': '#722ED1', '史地政': '#FA8C16', '史政生': '#EB2F96', '物化政': '#52C41A' };
const gradeOptions: GradeLevel[] = ['高一', '高二', '高三'];

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function ClassManage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [activeGrade, setActiveGrade] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassInfo | null>(null);
  const [form] = Form.useForm();

  const loadClasses = () => { getClasses().then(setClasses).catch(console.error); };
  useEffect(() => { loadClasses(); getStaff().then(setAllStaff).catch(console.error); }, []);
  useRealtime('classes', loadClasses);

  const filtered = useMemo(() => classes.filter((c) => {
    if (activeGrade !== 'all' && c.grade !== activeGrade) return false;
    return true;
  }), [classes, activeGrade]);

  const gradeStats = useMemo(() => {
    return gradeOptions.map((grd) => {
      const cc = classes.filter((c) => c.grade === grd && c.status === '在读');
      const totalSlots = cc.reduce((s, c) => s + c.maxStudents, 0);
      const totalStudents = cc.reduce((s, c) => s + c.studentCount, 0);
      return {
        grade: grd,
        count: cc.length,
        students: totalStudents,
        slots: totalSlots,
        fullness: totalSlots > 0 ? Math.round((totalStudents / totalSlots) * 100) : 0,
      };
    });
  }, [classes]);

  const trackStats = useMemo(() => {
    return trackOptions.map((t) => ({
      track: t,
      count: classes.filter((c) => c.track === t && c.status === '在读').length,
    })).filter((t) => t.count > 0);
  }, [classes]);

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ maxStudents: 55 }); setModalOpen(true); }
  function openEdit(r: ClassInfo) { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }
  function handleDelete(id: string) { deleteClass(id).then(loadClasses).then(() => message.success('已删除')); }

  function handleGraduate(cls: ClassInfo) {
    updateClass(cls.id, { status: '毕业', graduateYear: 2026 }).then(loadClasses).then(() => message.success(`${cls.name} 已标记为毕业`));
  }

  function handleSave() {
    form.validateFields().then((v) => {
      if (editing) {
        updateClass(editing.id, v).then(loadClasses).then(() => message.success('已更新'));
      } else {
        createClass({ id: newId(), status: '在读', ...v }).then(loadClasses).then(() => message.success('已添加'));
      }
      setModalOpen(false);
    });
  }

  const columns: ColumnsType<ClassInfo> = [
    { title: '班级', dataIndex: 'name', width: 130, fixed: 'left', render: (v: string, r) => (
      <Space><Text strong>{v}</Text>{r.status === '毕业' && <Tag color="default" style={{ fontSize: 10 }}>毕业</Tag>}</Space>
    )},
    { title: '年级', dataIndex: 'grade', width: 60 },
    { title: '选科', dataIndex: 'track', width: 110, render: (t: string) => (
      <Tag color={trackColors[t]} bordered={false} style={{ borderRadius: 4 }}>{t}</Tag>
    )},
    { title: '班主任', dataIndex: 'homeroomTeacher', width: 85 },
    { title: '教室', dataIndex: 'room', width: 135 },
    {
      title: '人数', width: 150,
      render: (_, r) => (
        <Row align="middle" gutter={8}>
          <Col flex="auto">
            <Progress percent={Math.round((r.studentCount / r.maxStudents) * 100)} size="small"
              strokeColor={r.studentCount >= r.maxStudents ? '#ff4d4f' : r.studentCount >= r.maxStudents * 0.9 ? '#faad14' : '#5B8DEF'}
              format={() => ''} style={{ marginBottom: 0 }} />
          </Col>
          <Col><Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{r.studentCount}/{r.maxStudents}</Text></Col>
        </Row>
      ),
    },
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <a onClick={() => openEdit(r)} style={{ fontSize: 13 }}>编辑</a>
          {r.status === '在读' && r.grade === '高三' && (
            <Popconfirm title={`确定将 ${r.name} 标记为毕业？`} onConfirm={() => handleGraduate(r)}>
              <a style={{ color: '#faad14', fontSize: 13 }}>毕业</a>
            </Popconfirm>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#ff4d4f', fontSize: 13 }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>班级管理</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {gradeStats.map((gs) => (
          <Col xs={8} md={6} lg={5} key={gs.grade}>
            <Card
              size="small" hoverable
              style={{
                borderRadius: 8, cursor: 'pointer',
                borderColor: activeGrade === gs.grade ? '#5B8DEF' : undefined,
                borderWidth: activeGrade === gs.grade ? 2 : 1,
              }}
              onClick={() => setActiveGrade(activeGrade === gs.grade ? 'all' : gs.grade)}
            >
              <Statistic
                title={<Space><TeamOutlined />{gs.grade}</Space>}
                value={gs.count}
                suffix={`个班 · ${gs.students}人`}
                valueStyle={{ fontSize: 24, fontWeight: 600 }}
              />
              <Progress percent={gs.fullness} size="small" strokeColor={gs.fullness >= 95 ? '#ff4d4f' : '#5B8DEF'} style={{ marginTop: 4 }} />
            </Card>
          </Col>
        ))}
        <Col xs={8} md={6} lg={4}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <TrophyOutlined style={{ fontSize: 24, color: '#bbb', marginBottom: 8 }} />
            <div><Text type="secondary" style={{ fontSize: 12 }}>已毕业班级</Text></div>
            <Text style={{ fontSize: 22, fontWeight: 600 }}>{classes.filter((c) => c.status === '毕业').length}</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card size="small" title={<Space><HomeOutlined />选科组合分布</Space>} style={{ borderRadius: 8 }}>
            <Space wrap>
              {trackStats.map((ts) => (
                <Tag key={ts.track} color={trackColors[ts.track]} style={{ padding: '4px 12px', fontSize: 13, borderRadius: 6 }}>
                  {ts.track} <strong>{ts.count}</strong> 个班
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col flex="auto">
          <Space>
            <Select value={activeGrade} onChange={setActiveGrade} style={{ width: 100 }}
              options={[{ label: '全部年级', value: 'all' }, ...gradeOptions.map((g) => ({ label: g, value: g }))]} />
            <Text type="secondary" style={{ fontSize: 12 }}>共 {filtered.length} 个班级</Text>
          </Space>
        </Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加班级</Button></Col>
      </Row>

      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 班` }}
        scroll={{ x: 800 }} size="middle" />

      <Modal title={editing ? '编辑班级' : '添加班级'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={500}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="班级名称" rules={[{ required: true }]}><Input placeholder="如：高一(6)班" /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="grade" label="年级" rules={[{ required: true }]}>
              <Select options={gradeOptions.map((g) => ({ label: g, value: g }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="track" label="选科组合" rules={[{ required: true }]}>
              <Select options={trackOptions.map((t) => ({ label: t, value: t }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="homeroomTeacher" label="班主任" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label"
                options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: s.name, value: s.name }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="room" label="教室"><Input placeholder="教学楼3层301" /></Form.Item></Col>
            <Col span={6}><Form.Item name="studentCount" label="学生人数" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="maxStudents" label="上限"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
