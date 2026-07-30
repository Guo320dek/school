# 青云高级中学系统全面优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面优化学校管理系统 — 安全健壮性、代码质量、功能完善、UI/UX 打磨，共四个阶段。

**Architecture:** 分阶段渐进式优化。Phase 1 加固后端安全（输入校验、SQL 注入修复、错误处理），Phase 2 提升前端代码质量（抽取公共逻辑、Loading 状态、大文件拆分），Phase 3 补全功能缺口（科目管理、学生花名册、仪表盘图表），Phase 4 打磨 UI/UX（页面过渡、微交互、响应式）。

**Tech Stack:** React 18 + Ant Design 5 + TypeScript + Vite + Express + SQLite (better-sqlite3) + WebSocket (ws)

## Global Constraints

- TypeScript strict mode: no `as any`, no `@ts-ignore`
- 所有页面在只读模式下隐藏增删改按钮（已有 `usePermission`）
- 保留现有 `useRealtime` 实时同步机制
- 不引入新的大型依赖（不装 chart.js 等额外库，用纯 CSS/React 实现）
- 不破坏现有 API 契约
- 每个 Phase 独立可交付，完成即验证构建

---

## Phase 1: 安全与健壮性

### Task 1.1: 后端 — crud 函数添加表字段白名单

**Files:**
- Modify: `server/index.cjs:42-92`

**Interfaces:**
- Consumes: 现有 `crud(table, idField)` 函数签名
- Produces: `crud(table, idField, allowedFields)` — allowedFields 为字符串数组，限制 POST/PUT 可写入的字段

**实现:**

在 `crud` 函数中添加 `allowedFields` 参数，create/update 只接受白名单内的字段。

- [ ] **Step 1: 修改 `crud` 函数签名和 create 方法**

在 `server/index.cjs` 第 42 行修改：

```js
// 修改前:
function crud(table, idField = 'id') {

// 修改后:
function crud(table, idField = 'id', allowedFields = null) {
```

在 `create` 方法（约第 61-70 行）添加过滤：

```js
create: (req, res) => {
  try {
    const db = getDb();
    let body = req.body;
    if (allowedFields) {
      body = {};
      for (const f of allowedFields) {
        if (req.body[f] !== undefined) body[f] = req.body[f];
      }
    }
    const keys = Object.keys(body);
    if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });
    const vals = Object.values(body);
    const placeholders = keys.map(() => '?').join(',');
    db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`).run(...vals);
    broadcast(table);
    res.status(201).json(body);
  } catch (e) { res.status(500).json({ error: e.message }); }
},
```

在 `update` 方法（约第 72-82 行）添加过滤：

```js
update: (req, res) => {
  try {
    const db = getDb();
    let body = req.body;
    if (allowedFields) {
      body = {};
      for (const f of allowedFields) {
        if (req.body[f] !== undefined) body[f] = req.body[f];
      }
    }
    const keys = Object.keys(body);
    if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });
    const vals = Object.values(body);
    const sets = keys.map(k => `${k} = ?`).join(',');
    db.prepare(`UPDATE ${table} SET ${sets} WHERE ${idField} = ?`).run(...vals, req.params.id);
    broadcast(table);
    res.json({ id: req.params.id, ...body });
  } catch (e) { res.status(500).json({ error: e.message }); }
},
```

- [ ] **Step 2: 为所有 API 路由添加 `allowedFields` 参数**

找到所有 `crud(...)` 调用（第 97-200 行），添加第三个参数：

```js
// Staff
const staffApi = crud('staff', 'id', ['name', 'gender', 'age', 'position', 'department', 'title', 'phone', 'email', 'hireDate', 'status', 'workload', 'specialty', 'certifications']);
// Salary
const salaryApi = crud('salary_records', 'id', ['staffId', 'staffName', 'month', 'baseSalary', 'overtime', 'bonus', 'deduction', 'total', 'status', 'remark']);
// Attendance
const attendanceApi = crud('attendance_records', 'id', ['staffId', 'staffName', 'date', 'checkIn', 'checkOut', 'status', 'remark']);
// Classes
const classApi = crud('classes', 'id', ['name', 'grade', 'track', 'homeroomTeacher', 'room', 'studentCount', 'maxStudents', 'status', 'graduateYear']);
// Subjects
const subjectApi = crud('subjects', 'id', ['name', 'category', 'teacherIds']);
// Grade Courses
const courseApi = crud('grade_courses', 'id', ['grade', 'subjectId', 'subjectName', 'weeklyHours', 'teacherId', 'teacherName']);
// Timetable
const timetableApi = crud('timetable_entries', 'id', ['classId', 'className', 'grade', 'dayOfWeek', 'period', 'subjectId', 'subjectName', 'teacherId', 'teacherName']);
// Exams
const examApi = crud('exams', 'id', ['name', 'grade', 'startDate', 'endDate', 'status', 'description']);
// Exam Sessions
const examSessionApi = crud('exam_sessions', 'id', ['examId', 'subjectId', 'subjectName', 'date', 'startTime', 'endTime', 'duration']);
// Exam Rooms
const examRoomApi = crud('exam_rooms', 'id', ['examId', 'room', 'capacity', 'invigilator']);
// Announcements
const announcementApi = crud('announcements', 'id', ['title', 'content', 'type', 'publishDate', 'publisher', 'isExpired', 'targetGrade']);
```

- [ ] **Step 3: 构建 + 启动验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node server/index.cjs
# Ctrl+C after "Server running on port 3001"
```

---

### Task 1.2: 后端 — SQL 注入防护（表名白名单）

**Files:**
- Modify: `server/index.cjs:42-92`

**问题:** `crud` 函数的 `table` 参数直接拼接进 SQL (`SELECT * FROM ${table}`)。如果攻击者能控制路由参数，可能注入。虽然当前路由硬编码表名，但为防御性编程应加固。

**实现:**

在 `crud` 函数开头添加表名白名单校验。

- [ ] **Step 1: 添加表名白名单**

在 `crud` 函数体开头（约第 43 行）：

```js
function crud(table, idField = 'id', allowedFields = null) {
  const VALID_TABLES = [
    'staff', 'salary_records', 'attendance_records',
    'classes', 'subjects', 'grade_courses', 'timetable_entries',
    'exams', 'exam_sessions', 'exam_rooms', 'announcements',
  ];
  if (!VALID_TABLES.includes(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  // ... rest of function
```

- [ ] **Step 2: 验证**

```bash
node server/index.cjs
# 应正常启动，输入 Ctrl+C 退出
```

---

### Task 1.3: 前端 — 用户级错误提示替代 console.error

**Files:**
- Modify: `src/pages/Timetable/index.tsx`
- Modify: `src/pages/CourseSetup/index.tsx`
- Modify: `src/pages/StaffArchive/index.tsx`
- Modify: `src/pages/Salary/index.tsx`
- Modify: `src/pages/ExamArrange/index.tsx`
- Modify: `src/pages/Dashboard/index.tsx`
- Modify: `src/pages/ClassManage/index.tsx`
- Modify: `src/pages/Attendance/index.tsx`
- Modify: `src/pages/Announcement/index.tsx`

**问题:** 所有页面的 `.catch(console.error)` 对终端用户不可见。应替换为 `message.error('加载失败，请刷新重试')`。

**实现:** 全局替换模式。

- [ ] **Step 1: 在所有页面中替换 `.catch(console.error)`**

每个页面的 `loadXxx().then(setXxx).catch(console.error)` 模式改为：

```tsx
// 修改前:
getStaff().then(setAllStaff).catch(console.error);

// 修改后:
getStaff().then(setAllStaff).catch(() => message.error('加载数据失败，请刷新重试'));
```

需要对 **所有 9 个页面** 中的 **所有** `.catch(console.error)` 进行替换。确保 `message` 已从 antd 导入。

- [ ] **Step 2: 在 delete/save 操作中添加错误处理**

所有 `.then(() => message.success('已删除'))` 模式后追加 `.catch(() => message.error('操作失败'))`：

```tsx
// 修改前:
deleteCourse(id).then(loadCourses).then(() => message.success('已删除'));

// 修改后:
deleteCourse(id).then(loadCourses).then(() => message.success('已删除')).catch(() => message.error('删除失败'));
```

- [ ] **Step 3: 验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
```

---

## Phase 2: 代码质量

### Task 2.1: 抽取 `newId` 到共享工具函数

**Files:**
- Create: `src/utils/id.ts`
- Modify: `src/pages/Timetable/index.tsx:21`
- Modify: `src/pages/CourseSetup/index.tsx:16`
- Modify: `src/pages/StaffArchive/index.tsx` (约第 16 行)
- Modify: `src/pages/ClassManage/index.tsx:18`
- Modify: `src/pages/Attendance/index.tsx:13`
- Modify: `src/pages/Salary/index.tsx` (约第 13 行)
- Modify: `src/pages/ExamArrange/index.tsx` (约第 13 行)
- Modify: `src/pages/Announcement/index.tsx` (约第 13 行)

**Interfaces:**
- Produces: `export function newId(): string` — 返回 `Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`

- [ ] **Step 1: 创建 `src/utils/id.ts`**

```ts
/** Generate a unique short ID for new records */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
```

- [ ] **Step 2: 替换所有页面中的 `newId` 定义**

在每个使用 `newId` 的页面：
1. 删除本地 `function newId() { ... }` 定义
2. 添加 import: `import { newId } from '../../utils/id';`

- [ ] **Step 3: 验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

---

### Task 2.2: 抽取通用 API 类型（共享的 Create/Update 类型）

**Files:**
- Create: `src/types/api.ts`
- Modify: `src/api/index.ts`

**Interfaces:**
- Produces: `type CreateInput<T> = Omit<T, 'id'> & { id: string }` 和 `type UpdateInput<T> = Partial<T>`

- [ ] **Step 1: 创建 `src/types/api.ts`**

```ts
/** Fields for creating a new record (id must be provided by caller) */
export type CreateInput<T> = Omit<T, 'id'> & { id: string };

/** Fields for updating an existing record (all optional) */
export type UpdateInput<T> = Partial<T>;
```

- [ ] **Step 2: 更新 `src/api/index.ts` 使用新类型**

将所有 `Omit<Staff, 'id'> & { id: string }` 替换为 `CreateInput<Staff>`，将 `Partial<Staff>` 替换为 `UpdateInput<Staff>`。同样替换 Course、TimetableEntry、Exam 等。

示例：

```ts
import type { CreateInput, UpdateInput } from '../types/api';

// 修改前:
export const createStaff = (data: Omit<Staff, 'id'> & { id: string }) => ...
export const updateStaff = (id: string, data: Partial<Staff>) => ...

// 修改后:
export const createStaff = (data: CreateInput<Staff>) => ...
export const updateStaff = (id: string, data: UpdateInput<Staff>) => ...
```

对所有实体类型（Staff, SalaryRecord, AttendanceRecord, ClassInfo, Subject, GradeCourse, TimetableEntry, Exam, ExamSession, ExamRoom, Announcement）执行相同替换。

- [ ] **Step 3: 验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
```

---

### Task 2.3: 所有页面添加 Loading 状态

**Files:**
- Modify: 所有 9 个页面组件

**问题:** 页面首次加载时无 loading 指示器，用户看到空表格。

**实现:**

- [ ] **Step 1: 为每个页面添加 `loading` 状态**

在每个页面组件中添加：

```tsx
const [loading, setLoading] = useState(true);

const loadData = () => {
  setLoading(true);
  Promise.all([getXxx(), getYyy()])
    .then(([data1, data2]) => {
      setXxx(data1);
      setYyy(data2);
    })
    .catch(() => message.error('加载数据失败'))
    .finally(() => setLoading(false));
};
```

- [ ] **Step 2: 在 Table 上绑定 `loading`**

```tsx
<Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} ... />
```

对所有包含 Table 的页面（Timetable 用自定义表格，在 Card 上加 `loading` 属性）。

- [ ] **Step 3: 验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

---

### Task 2.4: 拆分 Timetable 组件（460行 → 子组件）

**Files:**
- Create: `src/pages/Timetable/ClassView.tsx`
- Create: `src/pages/Timetable/TeacherView.tsx`
- Create: `src/pages/Timetable/ConflictModal.tsx`
- Modify: `src/pages/Timetable/index.tsx`

**分解策略:**
- `index.tsx` — 状态管理 + 数据加载 + 视图切换（~120行）
- `ClassView.tsx` — 班级课表表格渲染，接收 `grid`, `conflictMap`, `hoveredCell`, `editable`, 回调（~180行）
- `TeacherView.tsx` — 教师课表列表渲染，接收 `teacherEntries`（~90行）
- `ConflictModal.tsx` — 冲突弹窗，接收 `open`, `pendingFormValues`, `availableSlots`, 回调（~70行）

**Interfaces:**
- ClassView props: `{ grid, conflictMap, hoveredCell, onHover, editable, onAdd, onEdit, onDelete }`
- TeacherView props: `{ teacherEntries, teacherName, onEdit }`
- ConflictModal props: `{ open, pendingFormValues, availableSlots, staff, days, periods, onApplySlot, onForceSave, onCancel }`

- [ ] **Step 1: 创建 `ConflictModal.tsx`**

```tsx
import { Modal, Space, Typography, Card, Button } from 'antd';
import { WarningFilled } from '@ant-design/icons';
import type { Staff } from '../../types';

const { Text } = Typography;

const DAYS = ['周一', '周二', '周三', '周四', '周五'];
const PERIODS = [
  { idx: 1, time: '08:00-08:45' }, { idx: 2, time: '08:55-09:40' },
  { idx: 3, time: '10:00-10:45' }, { idx: 4, time: '10:55-11:40' },
  { idx: 5, time: '14:00-14:45' }, { idx: 6, time: '14:55-15:40' },
  { idx: 7, time: '15:50-16:35' },
];

interface ConflictModalProps {
  open: boolean;
  pendingFormValues: any;
  availableSlots: { dayOfWeek: number; period: number }[];
  staff: Staff[];
  onApplySlot: (dayOfWeek: number, period: number) => void;
  onForceSave: () => void;
  onCancel: () => void;
}

export default function ConflictModal({
  open, pendingFormValues, availableSlots, staff,
  onApplySlot, onForceSave, onCancel,
}: ConflictModalProps) {
  if (!pendingFormValues) return null;
  return (
    <Modal
      title={<Space><WarningFilled style={{ color: '#DC2626' }} />课表冲突</Space>}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={520}
    >
      <div style={{ marginBottom: 16, padding: 12, background: '#FFF2F0', borderRadius: 8, border: '1px solid #FFCCC7' }}>
        <Text strong style={{ color: '#DC2626' }}>
          {staff.find((s) => s.id === pendingFormValues.teacherId)?.name}
        </Text>
        <Text> 在 </Text>
        <Text strong>{DAYS[pendingFormValues.dayOfWeek - 1]} 第{pendingFormValues.period}节</Text>
        <Text> 已有排课，与当前安排冲突。</Text>
      </div>
      <Card size="small" title="可用时段（该班级与教师均空闲）" className="card-flat" style={{ marginBottom: 12 }}>
        {availableSlots.length === 0 ? (
          <Text type="secondary">暂无可用的空闲时段</Text>
        ) : (
          <Space wrap size={[8, 8]}>
            {availableSlots.map((s) => (
              <Button
                key={`${s.dayOfWeek}-${s.period}`}
                size="small"
                type="default"
                onClick={() => onApplySlot(s.dayOfWeek, s.period)}
              >
                {DAYS[s.dayOfWeek - 1]} 第{s.period}节 ({PERIODS.find((p) => p.idx === s.period)?.time})
              </Button>
            ))}
          </Space>
        )}
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>返回修改</Button>
        <Button danger onClick={onForceSave}>仍然添加（忽略冲突）</Button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: 创建 `ClassView.tsx`**

从 `Timetable/index.tsx` 提取班级课表表格（约第 236-341 行），封装为组件。Props 接口见上方。

- [ ] **Step 3: 创建 `TeacherView.tsx`**

从 `Timetable/index.tsx` 提取教师课表列表（约第 342-383 行），封装为组件。

- [ ] **Step 4: 重构 `index.tsx`**

删除已提取的 JSX 和常量子定义，导入子组件并传递 props。保留：
- 所有状态定义
- `loadEntries`, `useEffect`, `useRealtime`
- `useMemo` (grid, teacherEntries, filteredTeachers, conflictMap)
- 所有函数 (openAdd, openEdit, handleDelete, computeAvailableSlots, forceSave, applySlot, handleSave)
- 视图切换逻辑 (viewMode radio)
- 编辑 Modal

- [ ] **Step 5: 验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

---

## Phase 3: 功能完善

### Task 3.1: 科目管理页面

**Files:**
- Create: `src/pages/SubjectManage/index.tsx`
- Modify: `src/App.tsx` (添加路由)

**功能:** 在「课程设置」旁边新增「科目管理」Tab 或单独页面，支持增删改科目（含 teacherIds 配置）。

**Interfaces:**
- 复用现有 `/api/subjects` CRUD 端点
- 页面路径: `/subjects`

- [ ] **Step 1: 创建 `src/pages/SubjectManage/index.tsx`**

完整组件包含：
- 科目列表 Table（name, category Tag, 关联教师列表 Tag）
- 添加/编辑 Modal（name Input, category Select, teacherIds 多选 Select）
- 删除 Popconfirm
- 科目分类颜色（复用 CourseSetup 的 `catColors` 和 `catLabels`）
- 支持 `usePermission` 权限控制
- Loading 状态

代码框架：

```tsx
import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Popconfirm, Input, Select, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getSubjects, createSubject, updateSubject, deleteSubject, getStaff } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import { usePermission } from '../../contexts/PermissionContext';
import { newId } from '../../utils/id';
import type { Subject, Staff } from '../../types';

const { Title, Text } = Typography;

const catColors: Record<string, string> = { '主科': 'red', '选考': 'blue', '学考': 'green', '艺体': 'gold', '其他': 'default' };
const catOptions = ['主科', '选考', '学考', '艺体', '其他'];

export default function SubjectManage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form] = Form.useForm();

  const loadSubjects = () => {
    setLoading(true);
    getSubjects().then((raw: any[]) => {
      const parsed = raw.map((s: any) => ({
        ...s,
        teacherIds: typeof s.teacherIds === 'string' ? JSON.parse(s.teacherIds || '[]') : (s.teacherIds || []),
      }));
      setSubjects(parsed);
    }).catch(() => message.error('加载科目失败')).finally(() => setLoading(false));
  };

  useEffect(() => { loadSubjects(); getStaff().then(setAllStaff).catch(() => message.error('加载教师失败')); }, []);
  useRealtime('subjects', loadSubjects);
  const { editable } = usePermission();

  function openAdd() { setEditing(null); form.resetFields(); setModalOpen(true); }
  function openEdit(r: Subject) { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }
  function handleDelete(id: string) { deleteSubject(id).then(loadSubjects).then(() => message.success('已删除')).catch(() => message.error('删除失败')); }

  function handleSave() {
    form.validateFields().then((v) => {
      const data = { ...v, teacherIds: JSON.stringify(v.teacherIds || []) };
      if (editing) {
        updateSubject(editing.id, data).then(loadSubjects).then(() => message.success('已更新')).catch(() => message.error('更新失败'));
      } else {
        createSubject({ id: newId(), ...data }).then(loadSubjects).then(() => message.success('已添加')).catch(() => message.error('添加失败'));
      }
      setModalOpen(false);
    });
  }

  const columns: ColumnsType<Subject> = [
    { title: '科目名称', dataIndex: 'name', width: 120, render: (v: string) => <Text strong>{v}</Text> },
    { title: '分类', dataIndex: 'category', width: 100, render: (c: string) => <Tag color={catColors[c]}>{c}</Tag> },
    {
      title: '关联教师', dataIndex: 'teacherIds', width: 300,
      render: (ids: string[]) => (
        <Space wrap size={[4, 4]}>
          {ids.length === 0 ? <Text type="secondary" style={{ fontSize: 12 }}>未配置</Text> :
            ids.map((tid) => {
              const s = allStaff.find((st) => st.id === tid);
              return <Tag key={tid} style={{ fontSize: 11 }}>{s?.name ?? tid}</Tag>;
            })
          }
        </Space>
      ),
    },
    ...(editable ? [{
      title: '操作', width: 120,
      render: (_: unknown, r: Subject) => (
        <Space size={4}>
          <a onClick={() => openEdit(r)}>编辑</a>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <a style={{ color: '#DC2626' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>科目管理</Title>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">共 {subjects.length} 个科目</Text>
        {editable && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加科目</Button>}
      </div>
      <Table rowKey="id" columns={columns} dataSource={subjects} loading={loading} pagination={false} size="middle" />
      <Modal title={editing ? '编辑科目' : '添加科目'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={480}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="科目名称" rules={[{ required: true }]}><Input placeholder="如：物理" /></Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={catOptions.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="teacherIds" label="关联教师">
            <Select mode="multiple" showSearch optionFilterProp="label" placeholder="选择可教授该科目的教师"
              options={allStaff.filter((s) => s.status === '在职').map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: 注册路由**

在 `src/App.tsx` 添加路由：
```tsx
import SubjectManage from './pages/SubjectManage';
// 在 Routes 中添加:
<Route path="/subjects" element={<SubjectManage />} />
```

- [ ] **Step 3: 在侧边栏添加菜单项**

在 `src/layouts/MainLayout.tsx` 的侧边栏菜单中添加「科目管理」条目，链接 `/subjects`。

- [ ] **Step 4: 验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

---

### Task 3.2: 学生花名册页面

**Files:**
- Create: `src/pages/StudentRoster/index.tsx`
- Modify: `server/db.cjs` (添加 students 表和 seed 数据)
- Modify: `server/index.cjs` (添加 students API)
- Modify: `src/api/index.ts` (添加 students API 函数)
- Modify: `src/types/index.ts` (添加 Student 类型)
- Modify: `src/App.tsx` (添加路由)
- Modify: `src/layouts/MainLayout.tsx` (添加菜单)

**Interfaces:**
- Student: `{ id, name, gender, classId, className, studentNo, phone, address, enrollmentYear, status }`

- [ ] **Step 1: 添加 `Student` 类型**

在 `src/types/index.ts` 末尾添加：

```ts
export interface Student {
  id: string;
  name: string;
  gender: string;
  classId: string;
  className: string;
  studentNo: string;
  phone?: string;
  address?: string;
  enrollmentYear: number;
  status: '在读' | '休学' | '退学' | '毕业';
}
```

- [ ] **Step 2: 在 `server/db.cjs` 创建 students 表 + seed**

在 `initSchema` 约第 155 行后添加：

```js
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY, name TEXT, gender TEXT,
  classId TEXT, className TEXT, studentNo TEXT,
  phone TEXT, address TEXT, enrollmentYear INTEGER,
  status TEXT DEFAULT '在读'
);
```

在 `seed()` 函数中添加 students 种子数据（为每个班级生成 3-5 个学生）：

```js
const students = [];
const firstNames = ['伟','芳','娜','敏','静','丽','强','磊','洋','勇','艳','杰','军','秀英','涛','明','超','平','辉','玲'];
const lastNames = ['张','李','王','刘','陈','杨','赵','黄','周','吴','徐','孙','马','朱','胡','郭','何','高','林','罗'];
const genders = ['男','女'];

for (const cls of classData) {
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 students per class
  for (let i = 0; i < count; i++) {
    const sid = 'stu' + (students.length + 1).toString().padStart(3, '0');
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    students.push([
      sid,
      lastName + firstName,
      genders[Math.floor(Math.random() * 2)],
      cls[0],
      cls[1],
      '2024' + (students.length + 1).toString().padStart(4, '0'),
      '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
      '青云路' + (Math.floor(Math.random() * 100) + 1) + '号',
      2024,
      '在读'
    ]);
  }
}
const insStu = db.prepare('INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?)');
for (const s of students) insStu.run(...s);
```

- [ ] **Step 3: 添加 API 路由**

在 `server/index.cjs` 添加：

```js
// Students
const studentApi = crud('students', 'id', ['name', 'gender', 'classId', 'className', 'studentNo', 'phone', 'address', 'enrollmentYear', 'status']);
app.get('/api/students', studentApi.list);
app.get('/api/students/:id', studentApi.get);
app.post('/api/students', studentApi.create);
app.put('/api/students/:id', studentApi.update);
app.delete('/api/students/:id', studentApi.delete);
```

- [ ] **Step 4: 添加前端 API 函数**

在 `src/api/index.ts` 添加：

```ts
import type { Student } from '../types';

// ===== Students =====
export const getStudents = () => request<Student[]>('/students');
export const createStudent = (data: CreateInput<Student>) => request<Student>('/students', { method: 'POST', body: JSON.stringify(data) });
export const updateStudent = (id: string, data: UpdateInput<Student>) => request<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStudent = (id: string) => request<{ success: boolean }>(`/students/${id}`, { method: 'DELETE' });
```

- [ ] **Step 5: 创建 `StudentRoster` 页面**

创建 `src/pages/StudentRoster/index.tsx`，功能包含：
- 按年级/班级筛选
- 学生列表 Table（学号、姓名、性别、班级、状态）
- 添加/编辑 Modal
- 状态 Tag（在读绿色、休学橙色、退学红色、毕业灰色）
- 搜索（姓名/学号）
- Loading 状态
- 权限控制

- [ ] **Step 6: 注册路由和菜单**

同 Task 3.1，添加路由 `/students` 和菜单项。

- [ ] **Step 7: 删除旧 DB 重新种子，构建验证**

```bash
Remove-Item server/data.db -Force -ErrorAction SilentlyContinue
node server/index.cjs
# Ctrl+C after startup
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

---

### Task 3.3: 仪表盘趋势图表（纯 CSS/SVG，不引库）

**Files:**
- Modify: `src/pages/Dashboard/index.tsx`
- Create: `src/components/MiniBarChart.tsx`

**功能:** 在仪表盘添加简单的周出勤趋势条形图，纯 SVG 实现，不引入图表库。

- [ ] **Step 1: 创建 `MiniBarChart` 组件**

```tsx
// src/components/MiniBarChart.tsx
interface BarData { label: string; value: number; color?: string; }

interface MiniBarChartProps {
  data: BarData[];
  height?: number;
  maxValue?: number;
}

export default function MiniBarChart({ data, height = 120, maxValue }: MiniBarChartProps) {
  const actualMax = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = 24;
  const gap = 8;
  const chartH = height - 20;
  const totalW = data.length * (barWidth + gap) - gap;

  return (
    <svg width={totalW + 10} height={height} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / actualMax) * chartH, 2);
        const y = chartH - barH;
        return (
          <g key={d.label}>
            <rect
              x={i * (barWidth + gap)} y={y}
              width={barWidth} height={barH}
              rx={4} fill={d.color ?? '#5B6CF0'}
            />
            <text
              x={i * (barWidth + gap) + barWidth / 2}
              y={height - 4}
              textAnchor="middle" fontSize={10} fill="#888"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: 在 Dashboard 中集成**

在 Dashboard 页面的 `useEffect` 中添加近 5 天考勤数据获取，在统计卡片下方渲染 `MiniBarChart`：

```tsx
// 在 getAttendance().then(...) 中处理:
const last5Days: Record<string, number> = {};
for (let i = 4; i >= 0; i--) {
  const d = dayjs().subtract(i, 'day').format('MM-DD');
  last5Days[d] = 0;
}
records.forEach((r) => {
  const d = dayjs(r.date).format('MM-DD');
  if (d in last5Days) last5Days[d]++;
});
const barData = Object.entries(last5Days).map(([label, value]) => ({ label, value }));
```

然后渲染：

```tsx
<Card size="small" title="近5日出勤人次" className="card-flat" style={{ marginTop: 16 }}>
  <MiniBarChart data={barData} height={100} />
</Card>
```

- [ ] **Step 3: 验证**

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

---

## Phase 4: UI/UX 打磨

### Task 4.1: 页面切换过渡动画

**Files:**
- Modify: `src/App.tsx` 或 `src/layouts/MainLayout.tsx`

**实现:** 使用 CSS `@keyframes` + React 状态切换

- [ ] **Step 1: 在主布局内容区添加过渡动画**

在 `src/layouts/MainLayout.tsx` 的内容区外层包裹 div，添加 CSS：

```tsx
// 在 content 区域:
<div
  style={{
    animation: 'pageIn 0.35s cubic-bezier(0.2, 0, 0, 1)',
  }}
  key={location.pathname}  // React Router location 变化时重新触发
>
  <Outlet />
</div>
```

在 `src/index.css` 或 `src/main.tsx` 的全局样式中添加：

```css
@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: 验证**

手动切换侧边栏菜单，确认有平滑过渡效果。

---

### Task 4.2: Hover 微交互增强

**Files:**
- Modify: `src/index.css` 或各页面组件的 style

**实现:**

- [ ] **Step 1: 增强指标卡 hover 效果**

在 Dashboard 的指标卡 style 中添加：

```css
.metric-card {
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s;
}
.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}
.metric-card:hover .metric-icon {
  transform: scale(1.1);
}
```

- [ ] **Step 2: 表格行 hover 左侧指示线**

在全局 CSS 或 Table 组件中添加：

```css
.ant-table-row {
  transition: background 0.15s;
}
.ant-table-row:hover {
  box-shadow: inset 3px 0 0 #5B6CF0;
}
```

- [ ] **Step 3: 侧边栏 nav item 指示线**

在 MainLayout 中修改菜单项：

```css
.ant-menu-item {
  transition: all 0.2s;
}
.ant-menu-item-selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: #5B6CF0;
  border-radius: 0 2px 2px 0;
}
```

- [ ] **Step 4: 按钮按压反馈**

```css
.ant-btn:active {
  transform: scale(0.97);
  transition: transform 0.1s;
}
```

- [ ] **Step 5: 验证**

```bash
node node_modules/vite/bin/vite.js build
```

---

### Task 4.3: 移动端响应式增强

**Files:**
- Modify: `src/layouts/MainLayout.tsx` (侧边栏折叠)
- Modify: 各个页面（Card Row Col 断点调整）

**实现:**

- [ ] **Step 1: 侧边栏移动端自动折叠**

在 `MainLayout.tsx` 添加：

```tsx
const [collapsed, setCollapsed] = useState(false);
// 在 useEffect 中监听窗口大小
useEffect(() => {
  const handleResize = () => setCollapsed(window.innerWidth < 768);
  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

在 Sider 上绑定 `collapsed` 和 `breakpoint="lg"`。

- [ ] **Step 2: 页面统计卡片响应式**

确保所有 `Row gutter={16}` 包裹的统计卡片使用 `Col xs={24} sm={12} md={8} lg={6}` 等响应式断点。

- [ ] **Step 3: 表格横向滚动**

确保所有 Table 有 `scroll={{ x: 'max-content' }}` 在小屏幕上可横向滚动。

- [ ] **Step 4: 验证**

```bash
node node_modules/vite/bin/vite.js build
```

---

### Task 4.4: Toast 通知动效优化

**Files:**
- Modify: `src/index.css` 或 `src/main.tsx`

**实现:** 覆盖 Ant Design message 动画样式，增加弹性缓出。

- [ ] **Step 1: 添加 CSS 动画覆盖**

在 `src/index.css` 添加：

```css
/* Override Ant Design message animation for smoother feel */
.ant-message-notice {
  animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

- [ ] **Step 2: 验证**

快速操作增删改，观察 message 通知动效是否有弹性效果。

---

## 验证清单

全部 Phase 完成后：

- [ ] TypeScript 编译 0 错误: `node node_modules/typescript/bin/tsc --noEmit`
- [ ] Vite 构建成功: `node node_modules/vite/bin/vite.js build`
- [ ] 删除 `server/data.db` 后启动服务器，确认所有 API 正常
- [ ] 手动测试：添加科目 → 关联教师 → 添加课程 → 设置课表 → 冲突检测
- [ ] 手动测试：学生花名册 CRUD
- [ ] 手动测试：仪表盘 MiniBarChart 渲染
- [ ] 手动测试：侧边栏响应式折叠 (调整浏览器窗口 < 768px)
- [ ] 手动测试：页面切换过渡动画
- [ ] 手动测试：消息通知弹性动效

---

**Plan complete. Ready for execution.**
