import { useState, useEffect, useMemo } from 'react';
import { Button, Select, Modal, Form, Popconfirm, Space, Tag, Card, Typography, message, Radio, Tooltip, Empty, Row, Col } from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, ScheduleOutlined,
  UserOutlined, BookOutlined, WarningFilled,
} from '@ant-design/icons';
import { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, getClasses, getSubjects, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import type { TimetableEntry, ClassInfo, Subject, Staff } from '../../types';

const { Title, Text } = Typography;
const DAYS = ['周一', '周二', '周三', '周四', '周五'];
const PERIODS = [
  { idx: 1, time: '08:00-08:45' }, { idx: 2, time: '08:55-09:40' },
  { idx: 3, time: '10:00-10:45' }, { idx: 4, time: '10:55-11:40' },
  { idx: 5, time: '14:00-14:45' }, { idx: 6, time: '14:55-15:40' },
  { idx: 7, time: '15:50-16:35' },
];

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function Timetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('c11');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [form] = Form.useForm();
  const [hoveredCell, setHoveredCell] = useState<string>('');

  const loadEntries = () => { getTimetable().then(setEntries).catch(console.error); };
  useEffect(() => { loadEntries(); getClasses().then(setClasses).catch(console.error); getSubjects().then(setSubjects).catch(console.error); getStaff().then(setAllStaff).catch(console.error);   }, []);
  useRealtime('timetable_entries', loadEntries);

  const selectedClassName = useMemo(() => {
    const cls = classes.find((c) => c.id === selectedClass);
    return cls ? `${cls.name}（${cls.track}）` : '';
  }, [selectedClass, classes]);

  const grid = useMemo(() => {
    const g: Record<number, Record<number, TimetableEntry | undefined>> = {};
    DAYS.forEach((_, di) => { g[di + 1] = {}; PERIODS.forEach((p) => { g[di + 1][p.idx] = undefined; }); });
    if (viewMode === 'class') {
      entries.filter((e) => e.classId === selectedClass).forEach((e) => { g[e.dayOfWeek][e.period] = e; });
    }
    return g;
  }, [entries, selectedClass, viewMode]);

  const teacherEntries = useMemo(() => {
    if (!selectedTeacher) return [];
    return entries.filter((e) => e.teacherId === selectedTeacher).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period);
  }, [entries, selectedTeacher]);

  const conflictMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (entries[i].teacherId === entries[j].teacherId &&
            entries[i].dayOfWeek === entries[j].dayOfWeek &&
            entries[i].period === entries[j].period) {
          if (!map[entries[i].id]) map[entries[i].id] = [];
          if (!map[entries[j].id]) map[entries[j].id] = [];
          map[entries[i].id].push(entries[j].className);
          map[entries[j].id].push(entries[i].className);
        }
      }
    }
    return map;
  }, [entries]);

  function openAdd(day?: number, period?: number) {
    setEditingEntry(null);
    form.resetFields();
    form.setFieldsValue({ classId: selectedClass, dayOfWeek: day, period });
    setModalOpen(true);
  }

  function openEdit(e: TimetableEntry) { setEditingEntry(e); form.setFieldsValue(e); setModalOpen(true); }
  function handleDelete(id: string) { deleteTimetableEntry(id).then(loadEntries).then(() => message.success('已删除')); }

  function handleSave() {
    form.validateFields().then((v) => {
      const cls = classes.find((c) => c.id === v.classId);
      const sub = subjects.find((s) => s.id === v.subjectId);
      const teacher = allStaff.find((s) => s.id === v.teacherId);
      const entry = {
        id: editingEntry?.id ?? newId(),
        classId: v.classId, className: cls?.name ?? '', grade: cls?.grade ?? '高一',
        dayOfWeek: v.dayOfWeek, period: v.period,
        subjectId: v.subjectId, subjectName: sub?.name ?? '',
        teacherId: v.teacherId, teacherName: teacher?.name ?? '',
      };
      if (editingEntry) {
        updateTimetableEntry(editingEntry.id, entry).then(loadEntries).then(() => message.success('已更新'));
      } else {
        createTimetableEntry(entry).then(loadEntries).then(() => message.success('已添加'));
      }
      setModalOpen(false);
    });
  }

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>课表管理</Title>

      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space wrap>
          <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid" size="small">
            <Radio.Button value="class"><BookOutlined /> 班级课表</Radio.Button>
            <Radio.Button value="teacher"><UserOutlined /> 教师课表</Radio.Button>
          </Radio.Group>
          {viewMode === 'class' ? (
            <Select value={selectedClass} onChange={setSelectedClass} style={{ width: 240 }}
              options={classes.filter((c) => c.status === '在读').map((c) => ({
                label: `${c.name} - ${c.track} - ${c.homeroomTeacher}`, value: c.id,
              }))} />
          ) : (
            <Select value={selectedTeacher} onChange={setSelectedTeacher} placeholder="选择教师" allowClear style={{ width: 180 }}
              options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: `${s.name} (${s.department})`, value: s.id }))} />
          )}
        </Space>
      </Card>

      {viewMode === 'class' ? (
        <Card
          size="small"
          title={<Space><ScheduleOutlined />{selectedClassName}</Space>}
          style={{ borderRadius: 8, overflow: 'auto' }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>点击课节编辑，点空白格子添加</Text>}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#F5F7FA' }}>
                <th style={{ padding: '8px 4px', border: '1px solid #E8ECF1', width: 60, fontSize: 12, color: '#888' }}></th>
                {DAYS.map((d) => (
                  <th key={d} style={{ padding: '8px 4px', border: '1px solid #E8ECF1', fontWeight: 500, fontSize: 13 }}>
                    <div>{d}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p.idx}>
                  <td style={{ padding: '6px 4px', border: '1px solid #E8ECF1', background: '#FAFBFC' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>第{p.idx}节</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{p.time}</div>
                  </td>
                  {DAYS.map((_, di) => {
                    const entry = grid[di + 1]?.[p.idx];
                    const hasConflict = entry && conflictMap[entry.id];
                    const cellKey = `${di + 1}-${p.idx}`;
                    const isHovered = hoveredCell === cellKey;

                    if (!entry) {
                      return (
                        <td
                          key={di}
                          style={{
                            padding: 10, border: '1px solid #E8ECF1', cursor: 'pointer',
                            background: isHovered ? '#F0F5FF' : undefined,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell('')}
                          onClick={() => openAdd(di + 1, p.idx)}
                        >
                          {isHovered && (
                            <PlusOutlined style={{ color: '#bbb', fontSize: 16 }} />
                          )}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={di}
                        style={{
                          padding: 8, border: '1px solid #E8ECF1', cursor: 'pointer',
                          background: hasConflict ? '#FFF2F0' : isHovered ? '#D6E4FF' : '#E8F4FD',
                          transition: 'background 0.15s', position: 'relative',
                          borderRadius: 0,
                        }}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell('')}
                        onClick={() => openEdit(entry)}
                      >
                        <div style={{ fontWeight: 600, color: '#5B8DEF', fontSize: 13, marginBottom: 2 }}>
                          {entry.subjectName}
                        </div>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {entry.teacherName}
                        </div>
                        {hasConflict && (
                          <Tooltip title={`与 ${conflictMap[entry.id]?.join('、')} 冲突`}>
                            <WarningFilled style={{
                              color: '#ff4d4f', fontSize: 12,
                              position: 'absolute', top: 3, right: 3,
                            }} />
                          </Tooltip>
                        )}
                        {isHovered && (
                          <div style={{
                            position: 'absolute', top: 2, left: 2,
                            display: 'flex', gap: 2,
                          }}>
                            <Tooltip title="编辑">
                              <Button size="small" type="text" icon={<EditOutlined style={{ fontSize: 11 }} />}
                                style={{ padding: '0 2px', height: 18, minWidth: 18 }}
                                onClick={(e) => { e.stopPropagation(); openEdit(entry); }} />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Popconfirm title="删除这个课节？" onConfirm={(e) => { e?.stopPropagation(); handleDelete(entry.id); }}>
                                <Button size="small" type="text" danger icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                  style={{ padding: '0 2px', height: 18, minWidth: 18 }}
                                  onClick={(e) => e.stopPropagation()} />
                              </Popconfirm>
                            </Tooltip>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : selectedTeacher ? (
        <Card
          size="small"
           title={<Space><UserOutlined />{allStaff.find((s) => s.id === selectedTeacher)?.name} 的课表</Space>}
          style={{ borderRadius: 8 }}
        >
          {teacherEntries.length === 0 ? (
            <Empty description="该教师暂无排课" />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F5F7FA' }}>
                  <th style={{ padding: 8, border: '1px solid #E8ECF1' }}>星期</th>
                  <th style={{ padding: 8, border: '1px solid #E8ECF1' }}>节次</th>
                  <th style={{ padding: 8, border: '1px solid #E8ECF1' }}>时间</th>
                  <th style={{ padding: 8, border: '1px solid #E8ECF1' }}>科目</th>
                  <th style={{ padding: 8, border: '1px solid #E8ECF1' }}>班级</th>
                </tr>
              </thead>
              <tbody>
                {teacherEntries.map((e) => (
                  <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(e)}>
                    <td style={{ padding: 8, border: '1px solid #E8ECF1' }}>{DAYS[e.dayOfWeek - 1]}</td>
                    <td style={{ padding: 8, border: '1px solid #E8ECF1' }}>第{e.period}节</td>
                    <td style={{ padding: 8, border: '1px solid #E8ECF1', fontSize: 11, color: '#888' }}>
                      {PERIODS.find((p) => p.idx === e.period)?.time}
                    </td>
                    <td style={{ padding: 8, border: '1px solid #E8ECF1', fontWeight: 500, color: '#5B8DEF' }}>
                      {e.subjectName}
                    </td>
                    <td style={{ padding: 8, border: '1px solid #E8ECF1' }}>{e.className}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <Card size="small" style={{ borderRadius: 8 }}>
          <Empty description="请选择一位教师查看课表" />
        </Card>
      )}

      <Modal title={editingEntry ? '编辑课节' : '添加课节'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={400}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="classId" label="班级" rules={[{ required: true }]}>
            <Select options={classes.filter((c) => c.status === '在读').map((c) => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="dayOfWeek" label="星期" rules={[{ required: true }]}>
              <Select options={DAYS.map((d, i) => ({ label: d, value: i + 1 }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="period" label="节次" rules={[{ required: true }]}>
              <Select options={PERIODS.map((p) => ({ label: `第${p.idx}节`, value: p.idx }))} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="subjectId" label="科目" rules={[{ required: true }]}>
              <Select options={subjects.map((s) => ({ label: s.name, value: s.id }))} /></Form.Item></Col>
            <Col span={12}><Form.Item name="teacherId" label="教师" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label"
                options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: s.name, value: s.id }))} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
