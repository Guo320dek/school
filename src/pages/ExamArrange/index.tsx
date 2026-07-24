import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, Input, InputNumber, Space, Tag, Card, Row, Col, Typography, message, Timeline, Steps } from 'antd';
import { PlusOutlined, ScheduleOutlined, EnvironmentOutlined, UserOutlined, FlagOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getExams, createExam, deleteExam, getExamSessions, createExamSession, deleteExamSession, getExamRooms, createExamRoom, deleteExamRoom, getSubjects, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import type { Exam, ExamSession, ExamRoom, GradeLevel, Subject, Staff } from '../../types';

const { Title, Text } = Typography;

const typeColor: Record<string, string> = { '月考': 'blue', '期中': 'orange', '期末': 'red', '一模': 'purple', '二模': 'purple', '三模': 'purple' };
const gradeOptions: GradeLevel[] = ['高一', '高二', '高三'];

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function ExamArrange() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('e1');
  const [tab, setTab] = useState<'schedule' | 'rooms'>('schedule');
  const [examModal, setExamModal] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [sessionForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [examForm] = Form.useForm();

  const loadExams = () => { getExams().then(setExams).catch(console.error); };
  const loadSessions = () => { getExamSessions().then(setSessions).catch(console.error); };
  const loadRooms = () => { getExamRooms().then(setRooms).catch(console.error); };
  useEffect(() => { loadExams(); loadSessions(); loadRooms(); getSubjects().then(setSubjects).catch(console.error); getStaff().then(setAllStaff).catch(console.error);   }, []);
  useRealtime('exams', loadExams);
  useRealtime('exam_sessions', loadSessions);
  useRealtime('exam_rooms', loadRooms);
  const { editable } = usePermission();

  const currentExam = useMemo(() => exams.find((e) => e.id === selectedExam), [exams, selectedExam]);
  const examSessions = useMemo(() => sessions.filter((s) => s.examId === selectedExam), [sessions, selectedExam]);
  const examRooms = useMemo(() => rooms.filter((r) => r.examId === selectedExam), [rooms, selectedExam]);

  const sortedSessions = useMemo(() => [...examSessions].sort((a, b) => a.date.localeCompare(b.date) || (a.timeSlot === '上午' ? -1 : 1)), [examSessions]);

  function addExam() { examForm.resetFields(); setExamModal(true); }
  function saveExam() { examForm.validateFields().then((v) => { createExam({ id: newId(), ...v }).then(loadExams).then(() => { setExamModal(false); message.success('考试已创建'); }); }); }
  function addSession() { sessionForm.resetFields(); sessionForm.setFieldsValue({ examId: selectedExam, duration: 120 }); setSessionModal(true); }
  function saveSession() { sessionForm.validateFields().then((v) => { const sub = subjects.find((s) => s.id === v.subjectId); createExamSession({ id: newId(), subjectName: sub?.name ?? '', ...v }).then(loadSessions).then(() => { setSessionModal(false); message.success('科目已添加'); }); }); }
  function addRoom() { roomForm.resetFields(); roomForm.setFieldsValue({ examId: selectedExam, capacity: 30 }); setRoomModal(true); }
  function saveRoom() { roomForm.validateFields().then((v) => { createExamRoom({ id: newId(), ...v }).then(loadRooms).then(() => { setRoomModal(false); message.success('考场已添加'); }); }); }

  const allExams = useMemo(() => exams.sort((a, b) => a.startDate.localeCompare(b.startDate)), [exams]);

  const sessionCols: ColumnsType<ExamSession> = [
    { title: '日期', dataIndex: 'date', width: 100 },
    { title: '时段', dataIndex: 'timeSlot', width: 60, render: (t: string) => <Tag color={t === '上午' ? 'blue' : 'gold'} bordered={false}>{t}</Tag> },
    { title: '科目', dataIndex: 'subjectName', width: 90, render: (v: string) => <Text strong>{v}</Text> },
    { title: '时长', dataIndex: 'duration', width: 80, render: (v: number) => `${v} 分钟` },
    ...(editable ? [{ title: '操作', width: 60, render: (_: unknown, r: ExamSession) => <Popconfirm title="删除？" onConfirm={() => { deleteExamSession(r.id).then(loadSessions).then(() => message.success('已删除')); }}><a style={{ color: '#DC2626', fontSize: 13 }}>删除</a></Popconfirm> }] : []),
  ];

  const roomCols: ColumnsType<ExamRoom> = [
    { title: '考场', dataIndex: 'room', width: 150 },
    { title: '容量', dataIndex: 'capacity', width: 60 },
    { title: '监考员A', dataIndex: 'invigilator1', width: 85 },
    { title: '监考员B', dataIndex: 'invigilator2', width: 85, render: (v: string) => v || <Text type="secondary">--</Text> },
    ...(editable ? [{ title: '操作', width: 60, render: (_: unknown, r: ExamRoom) => <Popconfirm title="删除？" onConfirm={() => { deleteExamRoom(r.id).then(loadRooms).then(() => message.success('已删除')); }}><a style={{ color: '#DC2626', fontSize: 13 }}>删除</a></Popconfirm> }] : []),
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>考试安排</Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card size="small" title={<Space><FlagOutlined />考试列表</Space>} extra={editable ? <Button size="small" onClick={addExam}>新建考试</Button> : null} className="card-flat">
            <Space wrap>
              {allExams.map((e) => (
                <Card
                  key={e.id} size="small" hoverable
                  style={{
                    width: 220, borderRadius: 8, cursor: 'pointer',
                    borderColor: selectedExam === e.id ? '#5B6CF0' : undefined,
                    borderWidth: selectedExam === e.id ? 2 : 1,
                  }}
                  onClick={() => setSelectedExam(e.id)}
                >
                  <Space direction="vertical" size={2}>
                    <Space><Tag color={typeColor[e.type]} bordered={false}>{e.type}</Tag><Text strong>{e.grade}</Text></Space>
                    <Text style={{ fontSize: 13 }}>{e.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      <ScheduleOutlined /> {e.startDate} ~ {e.endDate}
                    </Text>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="当前考试概览" className="card-flat">
            {currentExam ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text type="secondary" style={{ fontSize: 12 }}>考试名称</Text><br /><Text strong>{currentExam.name}</Text></div>
                <div><Text type="secondary" style={{ fontSize: 12 }}>年级 / 类型</Text><br /><Tag color={typeColor[currentExam.type]} bordered={false}>{currentExam.type}</Tag> {currentExam.grade}</div>
                <div><Text type="secondary" style={{ fontSize: 12 }}>日程</Text><br /><Text>{currentExam.startDate} ~ {currentExam.endDate}</Text></div>
                <div><Text type="secondary" style={{ fontSize: 12 }}>科目数</Text><br /><Text strong>{examSessions.length} 科</Text></div>
                <div><Text type="secondary" style={{ fontSize: 12 }}>考场数</Text><br /><Text strong>{examRooms.length} 个</Text></div>
              </Space>
            ) : <Text type="secondary">未选择考试</Text>}
          </Card>
        </Col>
      </Row>

      <Card
        size="small" className="card-flat"
        tabList={[
          { key: 'schedule', tab: <Space><ScheduleOutlined />考试日程 ({examSessions.length})</Space> },
          { key: 'rooms', tab: <Space><EnvironmentOutlined />考场分配 ({examRooms.length})</Space> },
        ]}
        activeTabKey={tab} onTabChange={(k) => setTab(k as 'schedule' | 'rooms')}
        tabBarExtraContent={editable ? (
          tab === 'schedule'
            ? <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addSession}>添加科目</Button>
            : <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addRoom}>添加考场</Button>
        ) : null}
      >
        {tab === 'schedule' ? (
          sortedSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">暂无考试科目，点击"添加科目"开始安排</Text></div>
          ) : (
            <Table rowKey="id" columns={sessionCols} dataSource={sortedSessions} pagination={false} size="middle" />
          )
        ) : (
          examRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">暂未分配考场，点击"添加考场"开始</Text></div>
          ) : (
            <Table rowKey="id" columns={roomCols} dataSource={examRooms} pagination={false} size="middle" />
          )
        )}
      </Card>

      <Modal title="新建考试" open={examModal} onOk={saveExam} onCancel={() => setExamModal(false)} destroyOnClose width={420}>
        <Form form={examForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="考试名称" rules={[{ required: true }]}><Input placeholder="如：2026年高一期中考试" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="grade" label="年级" rules={[{ required: true }]}><Select options={gradeOptions.map((g) => ({ label: g, value: g }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="type" label="类型" rules={[{ required: true }]}><Select options={['月考', '期中', '期末', '一模', '二模', '三模'].map((t) => ({ label: t, value: t }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}><Input placeholder="2026-07-10" /></Form.Item></Col>
            <Col span={12}><Form.Item name="endDate" label="结束日期" rules={[{ required: true }]}><Input placeholder="2026-07-12" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="添加考试科目" open={sessionModal} onOk={saveSession} onCancel={() => setSessionModal(false)} destroyOnClose width={400}>
        <Form form={sessionForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="examId" hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="date" label="日期" rules={[{ required: true }]}><Input placeholder="2026-07-10" /></Form.Item></Col>
            <Col span={12}><Form.Item name="timeSlot" label="时段" rules={[{ required: true }]}><Select options={[{ label: '上午', value: '上午' }, { label: '下午', value: '下午' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="subjectId" label="科目" rules={[{ required: true }]}>
              <Select options={subjects.filter((s) => s.category !== '艺体').map((s) => ({ label: s.name, value: s.id }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="duration" label="时长(分钟)" rules={[{ required: true }]}><InputNumber min={30} max={300} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <Modal title="添加考场" open={roomModal} onOk={saveRoom} onCancel={() => setRoomModal(false)} destroyOnClose width={400}>
        <Form form={roomForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="examId" hidden><Input /></Form.Item>
          <Form.Item name="room" label="考场" rules={[{ required: true }]}><Input placeholder="教学楼3层301" /></Form.Item>
          <Form.Item name="capacity" label="容量" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="invigilator1" label="监考员A" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: s.name, value: s.name }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="invigilator2" label="监考员B"><Select showSearch optionFilterProp="label" allowClear
              options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: s.name, value: s.name }))} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
