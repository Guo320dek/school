import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, Input, InputNumber, DatePicker, Space, Tag, Card, Row, Col, Statistic, Typography, message, Progress } from 'antd';
import {
  PlusOutlined, TeamOutlined, HomeOutlined, TrophyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getClasses, createClass, updateClass, deleteClass, getStaff, getAnnouncements, createAnnouncement } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import { newId } from '../../utils/id';
import type { ClassInfo, GradeLevel, SubjectTrack, Staff, Announcement } from '../../types';

const { Title, Text, Paragraph } = Typography;

const trackOptions: SubjectTrack[] = ['物化生', '物化地', '物生政', '史地政', '史政生', '物化政'];
const trackColors: Record<string, string> = { '物化生': '#5B6CF0', '物化地': '#13C2C2', '物生政': '#7C3AED', '史地政': '#D97706', '史政生': '#EB2F96', '物化政': '#10B981' };
const gradeOptions: GradeLevel[] = ['高一', '高二', '高三'];

export default function ClassManage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [activeGrade, setActiveGrade] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassInfo | null>(null);
  const [form] = Form.useForm();

  // Class bulletin board
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bulletinClass, setBulletinClass] = useState<ClassInfo | null>(null);
  const [bulletinOpen, setBulletinOpen] = useState(false);
  const [bulletinForm] = Form.useForm();

  const loadClasses = () => { setLoading(true); getClasses().then(setClasses).catch(() => message.error('加载数据失败，请刷新重试')).finally(() => setLoading(false)); };
  useEffect(() => { loadClasses(); getStaff().then(setAllStaff).catch(() => message.error('加载数据失败，请刷新重试')); getAnnouncements().then(setAnnouncements).catch(() => message.error('加载数据失败，请刷新重试')); }, []);
  useRealtime('classes', loadClasses);
  const { editable } = usePermission();

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
  function handleDelete(id: string) { deleteClass(id).then(loadClasses).then(() => message.success('已删除')).catch(() => message.error('删除失败')); }

  function handleGraduate(cls: ClassInfo) {
    updateClass(cls.id, { status: '毕业', graduateYear: 2026 }).then(loadClasses).then(() => message.success(`${cls.name} 已标记为毕业`));
  }

  function openBulletin(cls: ClassInfo) {
    setBulletinClass(cls);
    bulletinForm.resetFields();
    setBulletinOpen(true);
  }
  function postBulletin() {
    bulletinForm.validateFields().then((v) => {
      if (!bulletinClass) return;
      createAnnouncement({
        id: newId(),
        title: v.title,
        content: v.content,
        date: new Date().toISOString().slice(0, 10),
        priority: v.priority || '普通',
        target: bulletinClass.grade as any,
        expireDate: v.expireDate ? (v.expireDate as any).format('YYYY-MM-DD') : '',
        isExpired: false,
        classId: bulletinClass.id,
        className: bulletinClass.name,
      }).then(() => {
        getAnnouncements().then(setAnnouncements);
        message.success('公告已发布');
        bulletinForm.resetFields();
      }).catch(() => message.error('发布失败'));
    });
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
              strokeColor={r.studentCount >= r.maxStudents ? '#DC2626' : r.studentCount >= r.maxStudents * 0.9 ? '#faad14' : '#5B6CF0'}
              format={() => ''} style={{ marginBottom: 0 }} />
          </Col>
          <Col><Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{r.studentCount}/{r.maxStudents}</Text></Col>
        </Row>
      ),
    },
    ...(editable ? [{
      title: '操作', width: 140, fixed: 'right' as const,
      render: (_: unknown, r: ClassInfo) => (
        <Space size={4}>
          <a onClick={() => openEdit(r)} style={{ fontSize: 13 }}>编辑</a>
          <a onClick={() => openBulletin(r)} style={{ fontSize: 13 }}>公告</a>
          {r.status === '在读' && r.grade === '高三' && (
            <Popconfirm title={`确定将 ${r.name} 标记为毕业？`} onConfirm={() => handleGraduate(r)}>
              <a style={{ color: '#faad14', fontSize: 13 }}>毕业</a>
            </Popconfirm>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#DC2626', fontSize: 13 }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>班级管理</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {gradeStats.map((gs) => (
          <Col xs={8} md={6} lg={5} key={gs.grade}>
            <Card
              size="small" hoverable
              className="card-flat"
              onClick={() => setActiveGrade(activeGrade === gs.grade ? 'all' : gs.grade)}
            >
              <Statistic
                title={<Space><TeamOutlined />{gs.grade}</Space>}
                value={gs.count}
                suffix={`个班 · ${gs.students}人`}
                valueStyle={{ fontSize: 24, fontWeight: 600 }}
              />
              <Progress percent={gs.fullness} size="small" strokeColor={gs.fullness >= 95 ? '#DC2626' : '#5B6CF0'} style={{ marginTop: 4 }} />
            </Card>
          </Col>
        ))}
        <Col xs={8} md={6} lg={4}>
          <Card size="small" className="card-flat" style={{ textAlign: 'center' }}>
            <TrophyOutlined style={{ fontSize: 24, color: '#bbb', marginBottom: 8 }} />
            <div><Text type="secondary" style={{ fontSize: 12 }}>已毕业班级</Text></div>
            <Text style={{ fontSize: 22, fontWeight: 600 }}>{classes.filter((c) => c.status === '毕业').length}</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card size="small" title={<Space><HomeOutlined />选科组合分布</Space>} className="card-flat">
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
        {editable && <Col><Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加班级</Button></Col>}
      </Row>

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 班` }}
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

      {/* Class Bulletin Board Modal */}
      <Modal
        title={`${bulletinClass?.name ?? ''} 班级公告栏`}
        open={bulletinOpen}
        onCancel={() => setBulletinOpen(false)}
        footer={null}
        width={600}
      >
        {editable && (
          <div style={{ marginBottom: 16, padding: 12, background: '#FAFAFA', borderRadius: 8 }}>
            <Form form={bulletinForm} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
              <Form.Item name="title" rules={[{ required: true }]} style={{ flex: '1 1 200px' }}>
                <Input placeholder="公告标题" />
              </Form.Item>
              <Form.Item name="priority" style={{ width: 100 }}>
                <Select placeholder="优先级" options={[{ label: '普通', value: '普通' }, { label: '重要', value: '重要' }, { label: '紧急', value: '紧急' }]} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={postBulletin}>发布</Button>
              </Form.Item>
            </Form>
            <Form.Item name="content" rules={[{ required: true }]} style={{ marginTop: 8, marginBottom: 0 }}>
              <Input.TextArea rows={2} placeholder="公告内容..." />
            </Form.Item>
            <Form.Item name="expireDate" style={{ marginTop: 8, marginBottom: 0 }}>
              <DatePicker placeholder="有效期至（可选）" style={{ width: 200 }} />
            </Form.Item>
          </div>
        )}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {announcements.filter((a) => a.classId === bulletinClass?.id).length === 0 ? (
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 24 }}>暂无班级公告</Text>
          ) : (
            announcements.filter((a) => a.classId === bulletinClass?.id).map((a) => (
              <Card key={a.id} size="small" style={{ marginBottom: 8 }} title={
                <Space>
                  <Tag color={a.priority === '紧急' ? 'red' : a.priority === '重要' ? 'orange' : 'blue'}>{a.priority}</Tag>
                  <Text strong>{a.title}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{a.date}</Text>
                </Space>
              }>
                <Paragraph>{a.content}</Paragraph>
                {a.expireDate && <Text type="secondary" style={{ fontSize: 11 }}>有效期至 {a.expireDate}</Text>}
              </Card>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
