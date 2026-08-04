import { useState, useEffect, useMemo } from 'react';
import { Button, Select, Modal, Form, Popconfirm, Space, Card, Typography, message, Radio, Tooltip, Empty, Row, Col } from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, ScheduleOutlined,
  UserOutlined, BookOutlined, WarningFilled,
} from '@ant-design/icons';
import { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry, getClasses, getSubjects, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { useFilteredTeachers } from '../../hooks/useFilteredTeachers';
import { usePermission } from '../../contexts/PermissionContext';
import { newId } from '../../utils/id';
import type { TimetableEntry, ClassInfo, Subject, Staff } from '../../types';

const { Title, Text } = Typography;
const DAYS = ['周一', '周二', '周三', '周四', '周五'];
const PERIODS = [
  { idx: 1, time: '08:00-08:45' }, { idx: 2, time: '08:55-09:40' },
  { idx: 3, time: '10:00-10:45' }, { idx: 4, time: '10:55-11:40' },
  { idx: 5, time: '14:00-14:45' }, { idx: 6, time: '14:55-15:40' },
  { idx: 7, time: '15:50-16:35' },
];

// ---- Helpers ----

interface EntryParams {
  classId: string;
  dayOfWeek: number;
  period: number;
  subjectId: string;
  teacherId: string;
}

function buildEntry(
  id: string | null,
  params: EntryParams,
  classes: ClassInfo[],
  subjects: Subject[],
  teachers: Staff[],
): TimetableEntry {
  const cls = classes.find((c) => c.id === params.classId);
  const sub = subjects.find((s) => s.id === params.subjectId);
  const teacher = teachers.find((s) => s.id === params.teacherId);
  return {
    id: id ?? newId(),
    classId: params.classId,
    className: cls?.name ?? '',
    grade: cls?.grade ?? '高一',
    dayOfWeek: params.dayOfWeek,
    period: params.period,
    subjectId: params.subjectId,
    subjectName: sub?.name ?? '',
    teacherId: params.teacherId,
    teacherName: teacher?.name ?? '',
  };
}

// ---- Sub-components ----

function MismatchModal({
  open, onCancel, formValues, classes, subjects, allStaff,
  editingEntryId, onForceSave,
}: {
  open: boolean; onCancel: () => void;
  formValues: EntryParams | null;
  classes: ClassInfo[]; subjects: Subject[]; allStaff: Staff[];
  editingEntryId: string | null; onForceSave: (entry: TimetableEntry) => void;
}) {
  if (!formValues) return null;
  const teacher = allStaff.find((s) => s.id === formValues.teacherId);
  const subject = subjects.find((s) => s.id === formValues.subjectId);
  return (
    <Modal title="确认排课" open={open} onCancel={onCancel} footer={null} width={480}>
      <div style={{ padding: 16, background: '#FFF7E6', borderRadius: 8, border: '1px solid #FFD591', marginBottom: 16 }}>
        <Text strong style={{ color: '#D48806' }}>{teacher?.name}</Text>
        <Text> 未被关联到「</Text>
        <Text strong>{subject?.name}</Text>
        <Text>」科目。</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>该科目在科目管理中配置了关联教师，当前选择的教师不在其列表中。</Text>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>返回修改</Button>
        <Button type="primary" onClick={() => onForceSave(buildEntry(editingEntryId, formValues, classes, subjects, allStaff))}>
          仍然排课
        </Button>
      </div>
    </Modal>
  );
}

function ConflictModal({
  open, onCancel, formValues, classes, subjects, allStaff,
  editingEntryId, availableSlots, onApplySlot, onForceSave,
}: {
  open: boolean; onCancel: () => void;
  formValues: EntryParams | null;
  classes: ClassInfo[]; subjects: Subject[]; allStaff: Staff[];
  editingEntryId: string | null;
  availableSlots: { dayOfWeek: number; period: number }[];
  onApplySlot: (dayOfWeek: number, period: number) => void;
  onForceSave: (entry: TimetableEntry) => void;
}) {
  if (!formValues) return null;
  const teacher = allStaff.find((s) => s.id === formValues.teacherId);
  return (
    <Modal
      title={<Space><WarningFilled style={{ color: '#DC2626' }} />课表冲突</Space>}
      open={open} onCancel={onCancel} footer={null} width={520}
    >
      <div style={{ marginBottom: 16, padding: 12, background: '#FFF2F0', borderRadius: 8, border: '1px solid #FFCCC7' }}>
        <Text strong style={{ color: '#DC2626' }}>{teacher?.name}</Text>
        <Text> 在 </Text>
        <Text strong>{DAYS[formValues.dayOfWeek - 1]} 第{formValues.period}节</Text>
        <Text> 已有排课，与当前安排冲突。</Text>
      </div>
      <Card size="small" title="可用时段（该班级与教师均空闲）" className="card-flat" style={{ marginBottom: 12 }}>
        {availableSlots.length === 0 ? (
          <Text type="secondary">暂无可用的空闲时段</Text>
        ) : (
          <Space wrap size={[8, 8]}>
            {availableSlots.map((s) => (
              <Button key={`${s.dayOfWeek}-${s.period}`} size="small" type="default"
                onClick={() => onApplySlot(s.dayOfWeek, s.period)}>
                {DAYS[s.dayOfWeek - 1]} 第{s.period}节 ({PERIODS.find((p) => p.idx === s.period)?.time})
              </Button>
            ))}
          </Space>
        )}
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>返回修改</Button>
        <Button danger onClick={() => onForceSave(buildEntry(editingEntryId, formValues, classes, subjects, allStaff))}>
          仍然添加（忽略冲突）
        </Button>
      </div>
    </Modal>
  );
}

// ---- Main ----

export default function Timetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [mismatchModalOpen, setMismatchModalOpen] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<{ dayOfWeek: number; period: number }[]>([]);
  const [selectedFormSubjectId, setSelectedFormSubjectId] = useState<string>('');
  const [editingTeacherId, setEditingTeacherId] = useState<string>('');

  const loadEntries = () => { getTimetable().then(setEntries).catch(() => message.error('加载数据失败，请刷新重试')); };
  useEffect(() => {
    setLoading(true);
    let loaded = 0;
    const done = () => { loaded++; if (loaded >= 4) setLoading(false); };
    loadEntries();
    getClasses().then(setClasses).catch(() => message.error('加载数据失败，请刷新重试')).finally(done);
    getSubjects().then((raw: any[]) => {
      const parsed: Subject[] = raw.map((s) => ({
        ...s,
        teacherIds: typeof s.teacherIds === 'string' ? JSON.parse(s.teacherIds || '[]') : (s.teacherIds || []),
      }));
      setSubjects(parsed);
    }).catch(() => message.error('加载数据失败，请刷新重试')).finally(done);
    getStaff().then(setAllStaff).catch(() => message.error('加载数据失败，请刷新重试')).finally(done);
    done(); // loadEntries might already be done
  }, []);
  useRealtime('timetable_entries', loadEntries);
  const { editable } = usePermission();

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

  // Teachers filtered by selected subject in the add/edit form
  const filteredTeachers = useFilteredTeachers(allStaff, subjects, selectedFormSubjectId, editingTeacherId);

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
    setPendingFormValues(null);
    setSelectedFormSubjectId('');
    setEditingTeacherId('');
    form.resetFields();
    form.setFieldsValue({ classId: selectedClass, dayOfWeek: day, period });
    setModalOpen(true);
  }

  function openEdit(e: TimetableEntry) {
    setEditingEntry(e);
    setSelectedFormSubjectId(e.subjectId);
    setEditingTeacherId(e.teacherId);
    form.setFieldsValue(e);
    setModalOpen(true);
  }
  function handleDelete(id: string) { deleteTimetableEntry(id).then(loadEntries).then(() => message.success('已删除')).catch(() => message.error('删除失败')); }

  function computeAvailableSlots(classId: string, teacherId: string, excludeId?: string) {
    const slots: { dayOfWeek: number; period: number }[] = [];
    for (let d = 1; d <= 5; d++) {
      for (let p = 1; p <= 7; p++) {
        const classBusy = entries.some((e) => e.classId === classId && e.dayOfWeek === d && e.period === p && e.id !== excludeId);
        const teacherBusy = entries.some((e) => e.teacherId === teacherId && e.dayOfWeek === d && e.period === p && e.id !== excludeId);
        if (!classBusy && !teacherBusy) {
          slots.push({ dayOfWeek: d, period: p });
        }
      }
    }
    return slots;
  }

  function applySlot(dayOfWeek: number, period: number) {
    if (!pendingFormValues) return;
    const params = { ...pendingFormValues, dayOfWeek, period };
    const entry = buildEntry(editingEntry?.id ?? null, params, classes, subjects, allStaff);
    const save = editingEntry
      ? updateTimetableEntry(editingEntry.id, entry)
      : createTimetableEntry(entry);
    save.then(loadEntries).then(() => message.success('已保存到空闲时段'));
    setConflictModalOpen(false);
    setModalOpen(false);
    setPendingFormValues(null);
  }

  function handleSave() {
    form.validateFields().then((v: EntryParams) => {
      const sub = subjects.find((s) => s.id === v.subjectId);

      // Check 1: teacher-subject mismatch
      const teacherMismatch = sub && sub.teacherIds.length > 0 && !sub.teacherIds.includes(v.teacherId);
      if (teacherMismatch) {
        setPendingFormValues(v);
        setMismatchModalOpen(true);
        return;
      }

      // Check 2: teacher time conflict at this day + period
      const conflict = entries.find(
        (e) => e.teacherId === v.teacherId &&
               e.dayOfWeek === v.dayOfWeek &&
               e.period === v.period &&
               e.id !== editingEntry?.id
      );

      if (conflict) {
        const slots = computeAvailableSlots(v.classId, v.teacherId, editingEntry?.id);
        setAvailableSlots(slots);
        setPendingFormValues(v);
        setConflictModalOpen(true);
        return;
      }

      doSave(v);
    });
  }

  function doSave(v: EntryParams) {
    const entry = buildEntry(editingEntry?.id ?? null, v, classes, subjects, allStaff);
    const save = editingEntry
      ? updateTimetableEntry(editingEntry.id, entry)
      : createTimetableEntry(entry);
    save.then(loadEntries).then(() => message.success(editingEntry ? '已更新' : '已添加')).catch(() => message.error('保存失败'));
    setModalOpen(false);
  }

  function handleForceSave(entry: TimetableEntry) {
    const save = editingEntry
      ? updateTimetableEntry(editingEntry.id, entry)
      : createTimetableEntry(entry);
    save.then(loadEntries).then(() => message.success(editingEntry ? '已更新' : '已添加')).catch(() => message.error('保存失败'));
    setMismatchModalOpen(false);
    setModalOpen(false);
    setPendingFormValues(null);
  }

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>课表管理</Title>

      <Card size="small" className="card-flat" style={{ marginBottom: 16 }}>
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
          className="card-flat"
          style={{ overflow: 'auto' }}
          loading={loading}
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
                           onClick={() => editable && openAdd(di + 1, p.idx)}
                        >
                        {editable && isHovered && (
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
                         onClick={() => editable && openEdit(entry)}
                      >
                        <div style={{ fontWeight: 600, color: '#5B6CF0', fontSize: 13, marginBottom: 2 }}>
                          {entry.subjectName}
                        </div>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {entry.teacherName}
                        </div>
                        {hasConflict && (
                          <Tooltip title={`与 ${conflictMap[entry.id]?.join('、')} 冲突`}>
                            <WarningFilled style={{
                              color: '#DC2626', fontSize: 12,
                              position: 'absolute', top: 3, right: 3,
                            }} />
                          </Tooltip>
                        )}
                        {editable && isHovered && (
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
          className="card-flat"
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
                    <td style={{ padding: 8, border: '1px solid #E8ECF1', fontWeight: 500, color: '#5B6CF0' }}>
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
        <Card size="small" className="card-flat">
          <Empty description="请选择一位教师查看课表" />
        </Card>
      )}

      <Modal title={editingEntry ? '编辑课节' : '添加课节'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={400}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }} onValuesChange={(changed) => {
          if ('subjectId' in changed) setSelectedFormSubjectId(changed.subjectId || '');
        }}>
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
                options={filteredTeachers.map((s) => ({ label: s.name, value: s.id }))}
                notFoundContent={selectedFormSubjectId ? '该科目未配置关联教师' : '暂无可选教师'} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      <ConflictModal
        open={conflictModalOpen}
        onCancel={() => { setConflictModalOpen(false); setPendingFormValues(null); }}
        formValues={pendingFormValues}
        classes={classes} subjects={subjects} allStaff={allStaff}
        editingEntryId={editingEntry?.id ?? null}
        availableSlots={availableSlots}
        onApplySlot={applySlot}
        onForceSave={(entry) => {
          const save = editingEntry
            ? updateTimetableEntry(editingEntry.id, entry)
            : createTimetableEntry(entry);
          save.then(loadEntries).then(() => message.success(editingEntry ? '已更新' : '已添加（忽略冲突）'));
          setConflictModalOpen(false);
          setModalOpen(false);
          setPendingFormValues(null);
        }}
      />

      <MismatchModal
        open={mismatchModalOpen}
        onCancel={() => { setMismatchModalOpen(false); setPendingFormValues(null); }}
        formValues={pendingFormValues}
        classes={classes} subjects={subjects} allStaff={allStaff}
        editingEntryId={editingEntry?.id ?? null}
        onForceSave={handleForceSave}
      />
    </>
  );
}
