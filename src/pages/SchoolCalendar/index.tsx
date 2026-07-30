import { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Form, Popconfirm, Input, Select, DatePicker, Card, Tag, Typography, message, Badge } from 'antd';
import { PlusOutlined, LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import { newId } from '../../utils/id';
import type { CalendarEvent } from '../../types';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const typeColor: Record<string, string> = {
  '学期': 'blue', '假期': 'orange', '考试': 'red', '活动': 'green', '其他': 'default',
};

export default function SchoolCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs().startOf('month'));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form] = Form.useForm();

  const loadEvents = () => {
    setLoading(true);
    getCalendarEvents().then(setEvents).catch(() => message.error('加载校历失败')).finally(() => setLoading(false));
  };
  useEffect(() => { loadEvents(); }, []);
  useRealtime('calendar_events', loadEvents);
  const { editable } = usePermission();

  const monthDays = useMemo(() => {
    const start = currentDate.startOf('month');
    const end = currentDate.endOf('month');
    const startDay = start.day(); // 0=Sun
    const days: Dayjs[] = [];
    // Pad with previous month days
    for (let i = startDay - 1; i >= 0; i--) days.push(start.subtract(i + 1, 'day'));
    // Current month
    for (let i = 0; i < end.date(); i++) days.push(start.add(i, 'day'));
    // Pad to 42 cells (6 weeks)
    while (days.length < 42) days.push(end.add(days.length - days.filter(d => d.month() === start.month()).length - startDay + 1, 'day'));
    return days;
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const start = dayjs(e.date);
      const end = e.endDate ? dayjs(e.endDate) : start;
      let d = start;
      while (d.isBefore(end.add(1, 'day')) || d.isSame(end, 'day')) {
        const key = d.format('YYYY-MM-DD');
        if (!map[key]) map[key] = [];
        map[key].push(e);
        d = d.add(1, 'day');
      }
    });
    return map;
  }, [events]);

  const monthEvents = useMemo(() => {
    const start = currentDate.format('YYYY-MM');
    return events.filter((e) => e.date.startsWith(start));
  }, [events, currentDate]);

  function openAdd() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });
    setModalOpen(true);
  }
  function openEdit(e: CalendarEvent) {
    setEditing(e);
    form.setFieldsValue({
      ...e,
      date: dayjs(e.date),
      endDate: e.endDate ? dayjs(e.endDate) : undefined,
    });
    setModalOpen(true);
  }
  function handleDelete(id: string) {
    deleteCalendarEvent(id).then(loadEvents).then(() => message.success('已删除')).catch(() => message.error('删除失败'));
  }

  function handleSave() {
    form.validateFields().then((v: any) => {
      const data = {
        ...v,
        date: (v.date as Dayjs).format('YYYY-MM-DD'),
        endDate: v.endDate ? (v.endDate as Dayjs).format('YYYY-MM-DD') : undefined,
      };
      if (editing) {
        updateCalendarEvent(editing.id, data).then(loadEvents).then(() => message.success('已更新')).catch(() => message.error('更新失败'));
      } else {
        createCalendarEvent({ id: newId(), ...data }).then(loadEvents).then(() => message.success('已添加')).catch(() => message.error('添加失败'));
      }
      setModalOpen(false);
    });
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>校历管理</Title>

      <Card size="small" className="card-flat" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button size="small" icon={<LeftOutlined />} onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))} />
            <Text strong style={{ fontSize: 16, minWidth: 100, textAlign: 'center' }}>
              {currentDate.format('YYYY年 M月')}
            </Text>
            <Button size="small" icon={<RightOutlined />} onClick={() => setCurrentDate(currentDate.add(1, 'month'))} />
            <Button size="small" onClick={() => setCurrentDate(dayjs().startOf('month'))}>本月</Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Space size={4}>
              {Object.entries(typeColor).map(([t, c]) => (
                <Tag key={t} color={c} style={{ fontSize: 11 }}>{t}</Tag>
              ))}
            </Space>
            {editable && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAdd}>添加事件</Button>}
          </div>
        </div>
      </Card>

      <Card size="small" className="card-flat" style={{ marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {weekDays.map((d) => (
                <th key={d} style={{ padding: 8, fontSize: 12, color: '#888', fontWeight: 500, borderBottom: '1px solid #E8E2DC' }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, week) => (
              <tr key={week}>
                {monthDays.slice(week * 7, week * 7 + 7).map((d, di) => {
                  const key = d.format('YYYY-MM-DD');
                  const dayEvents = eventsByDate[key] || [];
                  const isCurrentMonth = d.month() === currentDate.month();
                  const isToday = d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

                  return (
                    <td key={di} style={{
                      padding: 4,
                      border: '1px solid #F0EDEA',
                      verticalAlign: 'top',
                      height: 80,
                      background: isCurrentMonth ? '#fff' : '#FAFAF7',
                      opacity: isCurrentMonth ? 1 : 0.4,
                    }}>
                      <div style={{
                        fontWeight: isToday ? 700 : 400,
                        fontSize: 12,
                        color: isToday ? '#fff' : isCurrentMonth ? '#333' : '#bbb',
                        background: isToday ? '#4062BB' : 'transparent',
                        borderRadius: isToday ? '50%' : 0,
                        width: isToday ? 22 : 'auto',
                        height: isToday ? 22 : 'auto',
                        display: isToday ? 'inline-flex' : 'inline',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 2,
                      }}>
                        {d.date()}
                      </div>
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id}
                          onClick={() => editable && openEdit(e)}
                          style={{
                            fontSize: 10, padding: '1px 4px', borderRadius: 3, marginBottom: 1,
                            background: typeColor[e.type] === 'red' ? '#FFF1F0' :
                              typeColor[e.type] === 'blue' ? '#F0F5FF' :
                              typeColor[e.type] === 'orange' ? '#FFF7E6' :
                              typeColor[e.type] === 'green' ? '#F6FFED' : '#FAFAFA',
                            color: typeColor[e.type] === 'red' ? '#DC2626' :
                              typeColor[e.type] === 'blue' ? '#4062BB' :
                              typeColor[e.type] === 'orange' ? '#D48806' :
                              typeColor[e.type] === 'green' ? '#389E0D' : '#888',
                            cursor: editable ? 'pointer' : 'default',
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          }}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <Text type="secondary" style={{ fontSize: 10 }}>+{dayEvents.length - 3}</Text>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Upcoming events list */}
      <Card size="small" title="近期事件" className="card-flat">
        {monthEvents.length === 0 ? (
          <Text type="secondary">本月无事件</Text>
        ) : (
          monthEvents.map((e) => (
            <div key={e.id} style={{
              padding: '8px 0', borderBottom: '1px solid #F0EDEA',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: editable ? 'pointer' : 'default',
            }}
              onClick={() => editable && openEdit(e)}
            >
              <Tag color={typeColor[e.type]} style={{ margin: 0, flexShrink: 0 }}>{e.type}</Tag>
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 13 }}>{e.title}</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {e.date}{e.endDate && e.endDate !== e.date ? ` ~ ${e.endDate}` : ''}
                </Text>
              </div>
              {e.description && <Text type="secondary" style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</Text>}
            </div>
          ))
        )}
      </Card>

      <Modal
        title={editing ? '编辑事件' : '添加事件'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose width={500}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="如：期中考试" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={Object.entries(typeColor).map(([k]) => ({ label: k, value: k }))} />
          </Form.Item>
          <Form.Item name="date" label="开始日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="结束日期（可选）">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          {editing && (
            <Popconfirm title="确定删除？" onConfirm={() => { handleDelete(editing.id); setModalOpen(false); }}>
              <Button danger>删除此事件</Button>
            </Popconfirm>
          )}
        </Form>
      </Modal>
    </>
  );
}
