import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, InputNumber, Space, Tag, Card, Row, Col, Typography, message, Progress, Tooltip } from 'antd';
import { PlusOutlined, BookOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getCourses, createCourse, updateCourse, deleteCourse, getSubjects, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import type { GradeCourse, GradeLevel, Subject, Staff } from '../../types';

const { Title, Text } = Typography;

const catColors: Record<string, string> = { '主科': 'red', '选考': 'blue', '学考': 'green', '艺体': 'gold', '其他': 'default' };
const catLabels: Record<string, string> = { '主科': '主科', '选考': '选考科目', '学考': '学考科目', '艺体': '艺体', '其他': '其他' };
const gradeOptions: GradeLevel[] = ['高一', '高二', '高三'];

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function CourseSetup() {
  const [courses, setCourses] = useState<GradeCourse[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [filterGrade, setFilterGrade] = useState<GradeLevel>('高一');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GradeCourse | null>(null);
  const [form] = Form.useForm();

  const loadCourses = () => { getCourses().then(setCourses).catch(console.error); };
  useEffect(() => { loadCourses(); getSubjects().then(setSubjects).catch(console.error); getStaff().then(setAllStaff).catch(console.error); }, []);
  useRealtime('grade_courses', loadCourses);
  const { editable } = usePermission();

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (c.grade !== filterGrade) return false;
      if (activeCat !== 'all') {
        const sub = subjects.find((s) => s.id === c.subjectId);
        if (sub?.category !== activeCat) return false;
      }
      return true;
    });
  }, [courses, filterGrade, activeCat]);

  const weeklyTotal = filtered.reduce((s, c) => s + c.weeklyHours, 0);
  const maxWeekly = 35;

  const catDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    filtered.forEach((c) => {
      const sub = subjects.find((s) => s.id === c.subjectId);
      const cat = sub?.category ?? '其他';
      dist[cat] = (dist[cat] || 0) + c.weeklyHours;
    });
    return dist;
  }, [filtered]);

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ grade: filterGrade }); setModalOpen(true); }
  function openEdit(r: GradeCourse) { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }
  function handleDelete(id: string) { deleteCourse(id).then(loadCourses).then(() => message.success('已删除')); }

  function handleSave() {
    form.validateFields().then((v) => {
      const sub = subjects.find((s) => s.id === v.subjectId);
      const teacher = allStaff.find((s) => s.id === v.teacherId);
      if (editing) {
        updateCourse(editing.id, { ...v, subjectName: sub?.name ?? editing.subjectName, teacherName: teacher?.name ?? editing.teacherName }).then(loadCourses).then(() => message.success('已更新'));
      } else {
        createCourse({ id: newId(), subjectName: sub?.name ?? '', teacherName: teacher?.name ?? '', ...v }).then(loadCourses).then(() => message.success('已添加'));
      }
      setModalOpen(false);
    });
  }

  const columns: ColumnsType<GradeCourse> = [
    { title: '科目', dataIndex: 'subjectName', width: 120, render: (v: string, r) => {
      const sub = subjects.find((s) => s.id === r.subjectId);
      return <Space><Text strong>{v}</Text><Tag color={catColors[sub?.category ?? '其他']} style={{ borderRadius: 4, fontSize: 11 }}>{sub?.category}</Tag></Space>;
    }},
    {
      title: '周课时', dataIndex: 'weeklyHours', width: 140,
      render: (v: number) => (
        <Tooltip title={`${v} 节 / 周`}>
          <Progress percent={Math.round((v / 6) * 100)} size="small" strokeColor="#5B6CF0" format={() => `${v} 节`} style={{ marginBottom: 0 }} />
        </Tooltip>
      ),
    },
    { title: '任课教师', dataIndex: 'teacherName', width: 100, render: (v: string) => <Space><UserOutlined style={{ color: '#bbb', fontSize: 12 }} />{v}</Space> },
    ...(editable ? [{
      title: '操作', width: 100,
      render: (_: unknown, r: GradeCourse) => (
        <Space size={4}>
          <a onClick={() => openEdit(r)} style={{ fontSize: 13 }}>编辑</a>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#DC2626', fontSize: 13 }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>课程设置</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card size="small" title={<Space><BookOutlined />科目库</Space>} className="card-flat">
            <Space wrap size={[8, 8]}>
               {subjects.map((s) => (
                <Tooltip key={s.id} title={`${catLabels[s.category]}`}>
                  <Tag
                    color={activeCat === s.category ? catColors[s.category] : undefined}
                    bordered={activeCat !== s.category}
                    style={{
                      cursor: 'pointer', padding: '4px 10px', fontSize: 13, borderRadius: 6,
                      opacity: activeCat !== 'all' && activeCat !== s.category ? 0.4 : 1,
                    }}
                    onClick={() => setActiveCat(activeCat === s.category ? 'all' : s.category)}
                  >
                    {s.name}
                  </Tag>
                </Tooltip>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title={<Space><ClockCircleOutlined />课时分布</Space>} className="card-flat">
            {Object.entries(catDistribution).map(([cat, hours]) => (
              <Row key={cat} align="middle" style={{ marginBottom: 6 }}>
                <Col span={8}><Text style={{ fontSize: 12 }}>{catLabels[cat] || cat}</Text></Col>
                <Col span={12}>
                  <Progress percent={Math.round((hours / weeklyTotal) * 100)} size="small" strokeColor={catColors[cat]} format={() => ''} />
                </Col>
                <Col span={4}><Text style={{ fontSize: 12 }}>{hours}节</Text></Col>
              </Row>
            ))}
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Text type="secondary">
                合计 <Text strong style={{ color: weeklyTotal >= maxWeekly ? '#DC2626' : '#5B6CF0' }}>{weeklyTotal}</Text> / {maxWeekly} 节
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col flex="auto">
          <Space>
            <Select value={filterGrade} onChange={setFilterGrade} style={{ width: 100 }}
              options={gradeOptions.map((g) => ({ label: g, value: g }))} />
            {activeCat !== 'all' && (
              <Tag closable color={catColors[activeCat]} onClose={() => setActiveCat('all')}>
                {catLabels[activeCat]}
              </Tag>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>{filtered.length} 门课程</Text>
          </Space>
        </Col>
        {editable && <Col><Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加课程</Button></Col>}
      </Row>

      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={false} size="middle" />

      <Modal title={editing ? '编辑课程' : '添加课程'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={420}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="grade" label="年级" rules={[{ required: true }]}>
            <Select options={gradeOptions.map((g) => ({ label: g, value: g }))} />
          </Form.Item>
          <Form.Item name="subjectId" label="科目" rules={[{ required: true }]}>
            <Select options={subjects.map((s) => ({ label: `${s.name} (${s.category})`, value: s.id }))} />
          </Form.Item>
          <Form.Item name="weeklyHours" label="周课时" rules={[{ required: true }]}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="teacherId" label="任课教师" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label"
              options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
