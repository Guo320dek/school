import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, InputNumber, Space, Tag, Card, Row, Col, Typography, message, Progress, Tooltip } from 'antd';
import { PlusOutlined, BookOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getCourses, createCourse, updateCourse, deleteCourse, getSubjects, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { useFilteredTeachers } from '../../hooks/useFilteredTeachers';
import { usePermission } from '../../contexts/PermissionContext';
import { newId } from '../../utils/id';
import type { GradeCourse, GradeLevel, Subject, Staff } from '../../types';

const { Title, Text } = Typography;

const catColors: Record<string, string> = { '主科': 'red', '选考': 'blue', '学考': 'green', '艺体': 'gold', '其他': 'default' };
const catLabels: Record<string, string> = { '主科': '主科', '选考': '选考科目', '学考': '学考科目', '艺体': '艺体', '其他': '其他' };
const gradeOptions: GradeLevel[] = ['高一', '高二', '高三'];

export default function CourseSetup() {
  const [courses, setCourses] = useState<GradeCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [filterGrade, setFilterGrade] = useState<GradeLevel>('高一');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GradeCourse | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [editingTeacherId, setEditingTeacherId] = useState<string>('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalType, setConfirmModalType] = useState<'mismatch' | 'overload'>('mismatch');
  const [pendingFormValues, setPendingFormValues] = useState<any>(null);
  const [form] = Form.useForm();

  const loadCourses = () => { setLoading(true); getCourses().then(setCourses).catch(() => message.error('加载数据失败，请刷新重试')).finally(() => setLoading(false)); };
  useEffect(() => {
    loadCourses();
    getSubjects().then((raw: any[]) => {
      const parsed: Subject[] = raw.map((s) => ({
        ...s,
        teacherIds: typeof s.teacherIds === 'string' ? JSON.parse(s.teacherIds || '[]') : (s.teacherIds || []),
      }));
      setSubjects(parsed);
    }).catch(() => message.error('加载数据失败，请刷新重试'));
    getStaff().then(setAllStaff).catch(() => message.error('加载数据失败，请刷新重试'));
  }, []);
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

  const MAX_TEACHER_HOURS = 10;

  // Teachers filtered by selected subject (dropdown shows only matching; always include current editing teacher)
  const filteredTeachers = useFilteredTeachers(allStaff, subjects, selectedSubjectId, editingTeacherId);

  // Per-teacher weekly hours across ALL grades
  const teacherWorkload = useMemo(() => {
    const map: Record<string, { name: string; hours: number }> = {};
    courses.forEach((c) => {
      if (!map[c.teacherId]) map[c.teacherId] = { name: c.teacherName, hours: 0 };
      map[c.teacherId].hours += c.weeklyHours;
    });
    return Object.entries(map).sort((a, b) => b[1].hours - a[1].hours);
  }, [courses]);

  function openAdd() {
    setEditing(null);
    setSelectedSubjectId('');
    setEditingTeacherId('');
    form.resetFields();
    form.setFieldsValue({ grade: filterGrade });
    setModalOpen(true);
  }
  function openEdit(r: GradeCourse) {
    setEditing(r);
    setSelectedSubjectId(r.subjectId);
    setEditingTeacherId(r.teacherId);
    form.setFieldsValue(r);
    setModalOpen(true);
  }
  function handleDelete(id: string) { deleteCourse(id).then(loadCourses).then(() => message.success('已删除')).catch(() => message.error('删除失败')); }

  function doSave(v: any) {
    const sub = subjects.find((s) => s.id === v.subjectId);
    const teacher = allStaff.find((s) => s.id === v.teacherId);
    if (editing) {
      updateCourse(editing.id, { ...v, subjectName: sub?.name ?? editing.subjectName, teacherName: teacher?.name ?? editing.teacherName }).then(loadCourses).then(() => message.success('已更新')).catch(() => message.error('更新失败'));
    } else {
      createCourse({ id: newId(), subjectName: sub?.name ?? '', teacherName: teacher?.name ?? '', ...v }).then(loadCourses).then(() => message.success('已添加')).catch(() => message.error('添加失败'));
    }
    setModalOpen(false);
    setConfirmModalOpen(false);
    setPendingFormValues(null);
  }

  function handleSave() {
    form.validateFields().then((v) => {
      const sub = subjects.find((s) => s.id === v.subjectId);

      // Check 1: teacher-subject mismatch
      const teacherMismatch = sub && sub.teacherIds.length > 0 && !sub.teacherIds.includes(v.teacherId);

      // Check 2: teacher hours overload
      const existingHours = courses
        .filter((c) => c.teacherId === v.teacherId && c.id !== editing?.id)
        .reduce((sum, c) => sum + c.weeklyHours, 0);
      const newTotal = existingHours + v.weeklyHours;
      const hoursOverload = newTotal > MAX_TEACHER_HOURS;

      if (teacherMismatch) {
        setPendingFormValues(v);
        setConfirmModalType('mismatch');
        setConfirmModalOpen(true);
        return;
      }

      if (hoursOverload) {
        setPendingFormValues(v);
        setConfirmModalType('overload');
        setConfirmModalOpen(true);
        return;
      }

      doSave(v);
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
                <Tooltip key={s.id} title={`${catLabels[s.category]}${s.teacherIds.length > 0 ? ` — ${s.teacherIds.length}位教师` : ''}`}>
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

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card size="small" title={<Space><UserOutlined />教师周课时分布</Space>} className="card-flat">
            {teacherWorkload.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>暂无排课</Text>
            ) : (
              <Space wrap size={[12, 6]}>
                {teacherWorkload.map(([tid, { name, hours }]) => (
                  <Tooltip key={tid} title={`${name}: ${hours} 节/周`}>
                    <Tag
                      color={hours > MAX_TEACHER_HOURS ? 'red' : hours >= MAX_TEACHER_HOURS * 0.8 ? 'orange' : 'blue'}
                      style={{ borderRadius: 6, padding: '2px 8px', fontSize: 12 }}
                    >
                      {name} {hours}节
                    </Tag>
                  </Tooltip>
                ))}
              </Space>
            )}
            <div style={{ marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                上限 {MAX_TEACHER_HOURS} 节/周 — 红色超限，橙色接近上限
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

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} pagination={false} size="middle" scroll={{ x: 'max-content' }} />

      <Modal title={editing ? '编辑课程' : '添加课程'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={420}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }} onValuesChange={(changed) => {
          if ('subjectId' in changed) setSelectedSubjectId(changed.subjectId || '');
        }}>
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
              options={filteredTeachers.map((s) => ({ label: s.name, value: s.id }))}
              notFoundContent={selectedSubjectId ? '该科目未配置关联教师，请在科目库中设置' : '暂无可选教师'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirmation Modal — teacher mismatch or hours overload */}
      <Modal
        title="确认操作"
        open={confirmModalOpen}
        onCancel={() => { setConfirmModalOpen(false); setPendingFormValues(null); }}
        footer={null}
        width={480}
      >
        {pendingFormValues && confirmModalType === 'mismatch' && (
          <>
            <div style={{ padding: 16, background: '#FFF7E6', borderRadius: 8, border: '1px solid #FFD591', marginBottom: 16 }}>
              <Text strong style={{ color: '#D48806' }}>
                {allStaff.find((s) => s.id === pendingFormValues.teacherId)?.name}
              </Text>
              <Text> 未被关联到「</Text>
              <Text strong>{subjects.find((s) => s.id === pendingFormValues.subjectId)?.name}</Text>
              <Text>」科目。</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                该科目在科目管理中配置了关联教师，当前选择的教师不在其列表中。
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => { setConfirmModalOpen(false); setPendingFormValues(null); }}>返回修改</Button>
              <Button type="primary" onClick={() => pendingFormValues && doSave(pendingFormValues)}>仍然添加</Button>
            </div>
          </>
        )}
        {pendingFormValues && confirmModalType === 'overload' && (
          <>
            <div style={{ padding: 16, background: '#FFF2F0', borderRadius: 8, border: '1px solid #FFCCC7', marginBottom: 16 }}>
              <Text strong style={{ color: '#DC2626' }}>
                {allStaff.find((s) => s.id === pendingFormValues.teacherId)?.name}
              </Text>
              <Text> 的周课时将超过上限。</Text>
              <div style={{ marginTop: 8 }}>
                <Row gutter={8}>
                  <Col span={8}><Text type="secondary">当前课时</Text><br /><Text strong style={{ fontSize: 18 }}>{
                    courses.filter((c) => c.teacherId === pendingFormValues.teacherId && c.id !== editing?.id)
                      .reduce((s, c) => s + c.weeklyHours, 0)
                  }</Text><Text type="secondary"> 节</Text></Col>
                  <Col span={8}><Text type="secondary">本次添加</Text><br /><Text strong style={{ fontSize: 18, color: '#4062BB' }}>+{pendingFormValues.weeklyHours}</Text><Text type="secondary"> 节</Text></Col>
                  <Col span={8}><Text type="secondary">合计</Text><br /><Text strong style={{ fontSize: 18, color: '#DC2626' }}>{
                    courses.filter((c) => c.teacherId === pendingFormValues.teacherId && c.id !== editing?.id)
                      .reduce((s, c) => s + c.weeklyHours, 0) + pendingFormValues.weeklyHours
                  }</Text><Text type="secondary"> 节</Text></Col>
                </Row>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>上限 {MAX_TEACHER_HOURS} 节/周</Text>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => { setConfirmModalOpen(false); setPendingFormValues(null); }}>返回修改</Button>
              <Button danger onClick={() => pendingFormValues && doSave(pendingFormValues)}>仍然添加（忽略上限）</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
