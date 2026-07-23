import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, DatePicker, TimePicker, Space, Tag, Card, Row, Col, Statistic, Typography, message, Radio, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getAttendance, createAttendance, updateAttendance, deleteAttendance, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import type { AttendanceRecord, Staff } from '../../types';
import dayjs, { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const statusColor: Record<string, string> = { '正常': 'green', '迟到': 'orange', '早退': 'gold', '缺勤': 'red', '请假': 'blue' };
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [form] = Form.useForm();
  const today = dayjs().format('YYYY-MM-DD');

  const loadRecords = () => { getAttendance().then(setRecords).catch(console.error); };
  useEffect(() => { loadRecords(); getStaff().then(setAllStaff).catch(console.error); }, []);
  useRealtime('attendance_records', loadRecords);
  const { editable } = usePermission();

  const filtered = useMemo(() => records.filter((r) => {
    if (searchName && !r.staffName.includes(searchName)) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(r.status)) return false;
    if (dateRange) { const d = dayjs(r.date); if (d.isBefore(dateRange[0]) || d.isAfter(dateRange[1])) return false; }
    return true;
  }), [records, searchName, filterStatus, dateRange]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { '正常': 0, '迟到': 0, '早退': 0, '缺勤': 0, '请假': 0 };
    filtered.forEach((r) => { c[r.status]++; });
    return c;
  }, [filtered]);

  const todayRecords = useMemo(() => records.filter((r) => r.date === today), [records, today]);
  const todayCounts: Record<string, number> = { '正常': 0, '迟到': 0, '早退': 0, '缺勤': 0, '请假': 0 };
  todayRecords.forEach((r) => { todayCounts[r.status]++; });

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ date: dayjs() }); setModalOpen(true); }
  function openEdit(r: AttendanceRecord) { setEditing(r); form.setFieldsValue({ ...r, date: dayjs(r.date), checkIn: r.checkIn ? dayjs(r.checkIn, 'HH:mm') : null, checkOut: r.checkOut ? dayjs(r.checkOut, 'HH:mm') : null }); setModalOpen(true); }
  function handleDelete(id: string) { deleteAttendance(id).then(loadRecords).then(() => message.success('已删除')); }

  function handleSave() {
    form.validateFields().then((v) => {
      const staff = allStaff.find((st) => st.id === v.staffId);
      const tfmt = (t: Dayjs | null) => (t ? t.format('HH:mm') : null);
      const record = {
        id: editing?.id ?? newId(), staffId: v.staffId ?? editing?.staffId, staffName: staff?.name ?? editing?.staffName ?? '',
        date: (v.date as Dayjs).format('YYYY-MM-DD'), checkIn: tfmt(v.checkIn), checkOut: tfmt(v.checkOut), status: v.status, remark: v.remark || '',
      };
      if (editing) { updateAttendance(editing.id, record).then(loadRecords).then(() => message.success('已更新')); }
      else { createAttendance(record).then(loadRecords).then(() => message.success('已添加')); }
      setModalOpen(false);
    });
  }

  const columns: ColumnsType<AttendanceRecord> = [
    { title: '日期', dataIndex: 'date', width: 110, sorter: (a, b) => a.date.localeCompare(b.date) },
    { title: '员工姓名', dataIndex: 'staffName', width: 100 },
    { title: '签到', dataIndex: 'checkIn', width: 90, render: (v: string | null) => v ?? <span style={{ color: '#ccc' }}>--</span> },
    { title: '签退', dataIndex: 'checkOut', width: 90, render: (v: string | null) => v ?? <span style={{ color: '#ccc' }}>--</span> },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={statusColor[s]}>{s}</Tag> },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    ...(editable ? [{
      title: '操作', width: 120, fixed: 'right' as const, render: (_: unknown, r: AttendanceRecord) => 
        <Space><a onClick={() => openEdit(r)}>编辑</a><Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}><a style={{ color: '#ff4d4f' }}>删除</a></Popconfirm></Space>
    }] : []),
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>考勤系统</Title>
      <Card title={`今日打卡概况（${today}）`} size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={16}>
          {(['正常', '迟到', '早退', '缺勤', '请假'] as const).map((s) => (
            <Col span={4} key={s}><Statistic title={s} value={todayCounts[s]} suffix="人次"
              valueStyle={{ color: statusColor[s] === 'green' ? '#3f8600' : statusColor[s] === 'red' ? '#cf1322' : '#faad14', fontSize: 20 }} /></Col>
          ))}
        </Row>
      </Card>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {(['正常', '迟到', '早退', '缺勤', '请假'] as const).map((s) => (
          <Col key={s}><Card size="small" style={{ minWidth: 90 }}><Statistic title={s} value={counts[s]} valueStyle={{ fontSize: 22, color: statusColor[s] }} /></Card></Col>
        ))}
        <Col flex="auto" /><Col><Card size="small" style={{ minWidth: 100 }}><Statistic title="总计" value={filtered.length} valueStyle={{ fontSize: 22 }} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col flex="auto">
          <Space wrap>
            <Input placeholder="搜索员工姓名" value={searchName} onChange={(e) => setSearchName(e.target.value)} allowClear style={{ width: 160 }} />
            <RangePicker value={dateRange} onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)} placeholder={['开始日期', '结束日期']} />
            <Select mode="multiple" placeholder="考勤状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 200 }}
              options={[{ label: '正常', value: '正常' }, { label: '迟到', value: '迟到' }, { label: '早退', value: '早退' }, { label: '缺勤', value: '缺勤' }, { label: '请假', value: '请假' }]} />
          </Space>
        </Col>
        {editable && <Col><Button type="primary" onClick={openAdd}>添加考勤</Button></Col>}
      </Row>
      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} />
      <Modal title={editing ? '编辑考勤' : '添加考勤'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={480}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          {!editing && (<Form.Item name="staffId" label="员工" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={allStaff.filter((st) => st.status === '在职').map((st) => ({ label: `${st.name} - ${st.department}`, value: st.id }))} /></Form.Item>)}
          <Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="checkIn" label="签到时间"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="checkOut" label="签退时间"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="status" label="考勤状态" rules={[{ required: true }]}>
            <Radio.Group><Radio value="正常">正常</Radio><Radio value="迟到">迟到</Radio><Radio value="早退">早退</Radio><Radio value="缺勤">缺勤</Radio><Radio value="请假">请假</Radio></Radio.Group></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
