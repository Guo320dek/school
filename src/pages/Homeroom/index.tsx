import { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Row, Col, Spin, Empty, Tabs, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  TeamOutlined, BookOutlined, ScheduleOutlined, NotificationOutlined,
} from '@ant-design/icons';
import { getMyClass, getStudents, getTimetable, getAnnouncements } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import type { ClassInfo, Student, TimetableEntry, Announcement } from '../../types';

const { Title, Text } = Typography;

const DAYS = ['周一', '周二', '周三', '周四', '周五'];

export default function Homeroom() {
  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    getMyClass().then(({ cls: c }) => {
      setCls(c);
      if (c) {
        getStudents().then((all) => setStudents(all.filter((s) => s.classId === c.id && s.status === '在读')));
        getTimetable().then((all) => setTimetable(all.filter((t) => t.classId === c.id)));
        getAnnouncements().then((all) => setAnnouncements(all.filter(
          (a) => !a.isExpired && (a.target === c.grade || a.target === '全体' || a.classId === c.id)
        )));
      }
    }).finally(() => setLoading(false));
  }, []);
  useRealtime('timetable_entries', () => {
    if (cls) getTimetable().then((all) => setTimetable(all.filter((t) => t.classId === cls.id)));
  });
  useRealtime('announcements', () => {
    if (cls) getAnnouncements().then((all) => setAnnouncements(all.filter(
      (a) => !a.isExpired && (a.target === cls.grade || a.target === '全体' || a.classId === cls.id)
    )));
  });

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!cls) return <Empty description="您不是班主任，没有所管班级" />;

  const groupedTimetable: Record<number, TimetableEntry[]> = {};
  timetable.forEach((t) => {
    if (!groupedTimetable[t.dayOfWeek]) groupedTimetable[t.dayOfWeek] = [];
    groupedTimetable[t.dayOfWeek].push(t);
  });

  const studentColumns: ColumnsType<Student> = [
    { title: '学号', dataIndex: 'studentNo', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 90 },
    { title: '性别', dataIndex: 'gender', width: 60, render: (v) => <Tag>{v}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v) => <Tag color={v==='在读'?'green':'orange'}>{v}</Tag> },
    { title: '手机', dataIndex: 'phone', width: 130 },
  ];

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ fontWeight: 600 }}>我的班级</Title>
        <Text type="secondary">
          {cls.name} · {cls.track} · {cls.grade} · 教室 {cls.room} · 班主任 {cls.homeroomTeacher}
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="在读学生" value={students.length} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="本周课节" value={timetable.length} prefix={<ScheduleOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="最新通知" value={announcements.length} prefix={<NotificationOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="班额上限" value={cls.maxStudents} prefix={<BookOutlined />} suffix={`/ ${cls.maxStudents}`} /></Card></Col>
      </Row>

      <Tabs
        defaultActiveKey="students"
        items={[
          {
            key: 'students', label: <><TeamOutlined /> 学生名单 ({students.length})</>,
            children: (
              <Table rowKey="id" columns={studentColumns} dataSource={students}
                pagination={false} size="small" bordered scroll={{ y: 400 }} />
            ),
          },
          {
            key: 'timetable', label: <><ScheduleOutlined /> 班级课表</>,
            children: (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 13, minWidth: 600 }}>
                  <thead>
                    <tr style={{ background: '#F5F7FA' }}>
                      <th style={{ padding: 8, border: '1px solid #E8ECF1' }}>节次</th>
                      {DAYS.map((d) => <th key={d} style={{ padding: 8, border: '1px solid #E8ECF1' }}>{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4,5,6,7].map((p) => (
                      <tr key={p}>
                        <td style={{ padding: 8, border: '1px solid #E8ECF1', background: '#FAFBFC', fontWeight: 500 }}>第{p}节</td>
                        {DAYS.map((_, di) => {
                          const e = timetable.find((t) => t.dayOfWeek === di + 1 && t.period === p);
                          return (
                            <td key={di} style={{
                              padding: 6, border: '1px solid #E8ECF1',
                              background: e ? '#E8F4FD' : undefined,
                            }}>
                              {e ? <><div style={{ fontWeight: 600, color: '#5B6CF0', fontSize: 12 }}>{e.subjectName}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>{e.teacherName}</div></> : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            key: 'announcements', label: <><NotificationOutlined /> 相关通知 ({announcements.length})</>,
            children: announcements.length === 0 ? <Empty description="暂无相关通知" /> : (
              <div>
                {announcements.map((a) => (
                  <Card key={a.id} size="small" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Tag color={a.priority==='紧急'?'red':a.priority==='重要'?'orange':'blue'}>{a.priority}</Tag>
                      <Text strong>{a.title}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{a.date} · {a.target}</Text>
                  </Card>
                ))}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
