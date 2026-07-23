import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Select, Modal, Form, Popconfirm, InputNumber, Space, Tag, Card, Row, Col, Statistic, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getSalaries, createSalary, updateSalary, deleteSalary, getStaff } from '../../api';
import type { SalaryRecord, Staff } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
const fmt = (v: number) => `¥ ${v.toLocaleString()}`;

export default function Salary() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [filterYear, setFilterYear] = useState<number>();
  const [filterMonth, setFilterMonth] = useState<number>();
  const [filterStatus, setFilterStatus] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SalaryRecord | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const loadSalaries = () => { getSalaries().then(setSalaries).catch(console.error); };
  useEffect(() => { loadSalaries(); getStaff().then(setAllStaff).catch(console.error); }, []);

  const filtered = useMemo(() => salaries.filter((s) => {
    if (filterYear && s.year !== filterYear) return false;
    if (filterMonth && s.month !== filterMonth) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  }), [salaries, filterYear, filterMonth, filterStatus]);

  const totalPayable = filtered.reduce((sum, s) => sum + s.total, 0);
  const paidCount = filtered.filter((s) => s.status === '已发放').length;
  const pendingCount = filtered.filter((s) => s.status === '待发放').length;

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ year: dayjs().year(), month: dayjs().month() + 1 }); setModalOpen(true); }
  function openEdit(r: SalaryRecord) { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }
  function handleDelete(id: string) { deleteSalary(id).then(loadSalaries).then(() => message.success('已删除')); }

  function onFormValuesChange() {
    const base = form.getFieldValue('basePay') || 0;
    const bonus = form.getFieldValue('bonus') || 0;
    const ded = form.getFieldValue('deduction') || 0;
    form.setFieldValue('total', base + bonus - ded);
  }

  function handleSave() {
    form.validateFields().then((v) => {
      if (editing) {
        updateSalary(editing.id, v).then(loadSalaries).then(() => message.success('已更新'));
      } else {
        const staff = allStaff.find((st) => st.id === v.staffId);
        createSalary({ id: newId(), staffId: v.staffId, staffName: staff?.name ?? '', year: v.year, month: v.month, basePay: v.basePay, bonus: v.bonus, deduction: v.deduction, total: v.total, status: '待发放' }).then(loadSalaries).then(() => message.success('已添加'));
      }
      setModalOpen(false);
    });
  }

  function handleBatchPay() {
    if (selectedRowKeys.length === 0) { message.warning('请先选择待发放的工资记录'); return; }
    const today = dayjs().format('YYYY-MM-DD');
    Promise.all(selectedRowKeys.map((id) => {
      const s = salaries.find((r) => r.id === id);
      if (s && s.status === '待发放') return updateSalary(String(id), { status: '已发放', paidDate: today });
    })).then(loadSalaries).then(() => {
      setSelectedRowKeys([]);
      message.success(`已批量发放 ${selectedRowKeys.length} 笔工资`);
    });
  }

  const columns: ColumnsType<SalaryRecord> = [
    { title: '员工姓名', dataIndex: 'staffName', width: 100 },
    { title: '年/月', width: 100, render: (_, r) => `${r.year}/${String(r.month).padStart(2, '0')}` },
    { title: '基本工资', dataIndex: 'basePay', width: 110, render: fmt },
    { title: '奖金', dataIndex: 'bonus', width: 100, render: fmt },
    { title: '扣款', dataIndex: 'deduction', width: 100, render: fmt },
    { title: '实发合计', dataIndex: 'total', width: 120, sorter: (a, b) => a.total - b.total, render: (v: number) => <strong>{fmt(v)}</strong> },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag color={s === '已发放' ? 'green' : 'orange'}>{s}</Tag> },
    { title: '发放日期', dataIndex: 'paidDate', width: 110, render: (v: string | undefined) => v || '--' },
    { title: '操作', width: 120, fixed: 'right', render: (_, r) => (
      <Space><a onClick={() => openEdit(r)}>编辑</a><Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}><a style={{ color: '#ff4d4f' }}>删除</a></Popconfirm></Space>
    )},
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>工资管理</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="应发总额" value={totalPayable} prefix="¥" valueStyle={{ color: '#5B8DEF' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已发放" value={paidCount} suffix="笔" valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待发放" value={pendingCount} suffix="笔" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总记录" value={filtered.length} suffix="条" /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col flex="auto">
          <Space wrap>
            <Select placeholder="年份" value={filterYear} onChange={setFilterYear} allowClear style={{ width: 100 }} options={[2025, 2026].map((y) => ({ label: String(y), value: y }))} />
            <Select placeholder="月份" value={filterMonth} onChange={setFilterMonth} allowClear style={{ width: 100 }} options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))} />
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 110 }} options={[{ label: '待发放', value: '待发放' }, { label: '已发放', value: '已发放' }]} />
          </Space>
        </Col>
        <Col><Space><Button onClick={handleBatchPay} disabled={selectedRowKeys.length === 0}>批量发放</Button><Button type="primary" onClick={openAdd}>添加工资</Button></Space></Col>
      </Row>
      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} scroll={{ x: 900 }}
        rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys), getCheckboxProps: (r) => ({ disabled: r.status !== '待发放' }) }} />
      <Modal title={editing ? '编辑工资' : '添加工资'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={480}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }} onValuesChange={onFormValuesChange}>
          {!editing && (<>
            <Form.Item name="staffId" label="员工" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" options={allStaff.filter((st) => st.status === '在职').map((st) => ({ label: `${st.name} - ${st.department}`, value: st.id }))} /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="year" label="年份" rules={[{ required: true }]}><InputNumber min={2020} max={2030} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={12}><Form.Item name="month" label="月份" rules={[{ required: true }]}><InputNumber min={1} max={12} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
          </>)}
          <Row gutter={16}>
            <Col span={8}><Form.Item name="basePay" label="基本工资" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="bonus" label="奖金" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="deduction" label="扣款" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="total" label="实发合计"><InputNumber disabled style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
