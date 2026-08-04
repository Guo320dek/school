import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Select, Button, InputNumber, Space, Card, Typography, message, Tag, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getExams, getExamSessions, getClasses, getStudents, getSubjects, getScores, saveScores } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import type { Exam, ExamSession, ClassInfo, Student, Subject, ExamScore } from '../../types';

const { Title, Text } = Typography;

export default function ScoreEntry() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [existingScores, setExistingScores] = useState<ExamScore[]>([]);
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const loadExams = () => { getExams().then(setExams).catch(() => message.error('加载考试列表失败')); };
  useEffect(() => { loadExams(); getClasses().then(setClasses); getSubjects().then(setSubjects); }, []);
  useRealtime('exam_scores', () => {
    if (selectedExamId && selectedClassId) loadExistingScores();
  });

  useEffect(() => {
    if (selectedExamId) {
      getExamSessions(selectedExamId).then(setSessions);
      setSelectedSessionId('');
      setSelectedClassId('');
      setStudents([]);
      setScoreMap({});
    }
  }, [selectedExamId]);

  const loadExistingScores = useCallback(() => {
    if (!selectedExamId || !selectedClassId) return;
    getScores({ examId: selectedExamId, classId: selectedClassId }).then((scores) => {
      setExistingScores(scores);
      const map: Record<string, number> = {};
      scores.forEach((s) => { map[`${s.studentId}_${s.subjectId}`] = s.score; });
      setScoreMap(map);
    }).catch(() => message.error('加载已有成绩失败'));
  }, [selectedExamId, selectedClassId]);

  useEffect(() => {
    if (selectedClassId) {
      getStudents().then((all) => {
        setStudents(all.filter((s) => s.classId === selectedClassId && s.status === '在读'));
      });
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  useEffect(() => { loadExistingScores(); }, [loadExistingScores]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const sessionSubject = subjects.find((s) => s.id === selectedSession?.subjectId);

  const columns: ColumnsType<Student> = useMemo(() => [
    { title: '学号', dataIndex: 'studentNo', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 90, fixed: 'left' as const },
    ...(sessionSubject ? [{
      title: `${sessionSubject.name} (满分100)`,
      dataIndex: 'id' as const,
      width: 140,
      render: (studentId: string) => {
        const key = `${studentId}_${sessionSubject.id}`;
        return (
          <InputNumber
            min={0} max={100} step={0.5}
            value={scoreMap[key] ?? null}
            onChange={(v) => setScoreMap((prev) => ({ ...prev, [key]: v ?? 0 }))}
            placeholder="得分"
            style={{ width: 100 }}
          />
        );
      },
    }] : []),
  ], [sessionSubject, scoreMap]);

  const handleSave = async () => {
    if (!selectedExamId || !selectedSessionId || !selectedClassId || !sessionSubject) {
      message.warning('请选择考试场次和班级');
      return;
    }
    setLoading(true);
    const scores = students
      .map((stu) => {
        const key = `${stu.id}_${sessionSubject.id}`;
        const score = scoreMap[key];
        if (score === undefined || score === null) return null;
        return {
          examId: selectedExamId,
          examSessionId: selectedSessionId,
          studentId: stu.id,
          studentName: stu.name,
          classId: selectedClassId,
          className: classes.find((c) => c.id === selectedClassId)?.name ?? '',
          subjectId: sessionSubject.id,
          subjectName: sessionSubject.name,
          score,
        };
      })
      .filter(Boolean) as Omit<ExamScore, 'id'>[];

    if (scores.length === 0) {
      message.warning('没有成绩数据可保存');
      setLoading(false);
      return;
    }
    try {
      const res = await saveScores(scores);
      message.success(`已保存 ${res.count} 条成绩`);
      loadExistingScores();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    }
    setLoading(false);
  };

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>成绩录入</Title>

      <Card size="small" className="card-flat" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select placeholder="选择考试" value={selectedExamId || undefined} onChange={setSelectedExamId} style={{ width: 200 }}
            options={exams.map((e) => ({ label: `${e.name} (${e.grade})`, value: e.id }))} />
          <Select placeholder="选择场次" value={selectedSessionId || undefined} onChange={setSelectedSessionId} style={{ width: 220 }}
            options={sessions.map((s) => {
              const sub = subjects.find((x) => x.id === s.subjectId);
              return { label: `${sub?.name ?? s.subjectName} ${s.date} ${s.timeSlot}`, value: s.id };
            })} disabled={!selectedExamId} />
          <Select placeholder="选择班级" value={selectedClassId || undefined} onChange={setSelectedClassId} style={{ width: 180 }}
            options={classes.filter((c) => c.status === '在读').map((c) => ({ label: c.name, value: c.id }))}
            disabled={!selectedSessionId} />
          {sessionSubject && (
            <Tag color="blue">{sessionSubject.name} · 满分100</Tag>
          )}
        </Space>
      </Card>

      {students.length > 0 && sessionSubject && (
        <>
          <Row align="middle" style={{ marginBottom: 12 }}>
            <Col flex="auto">
              <Text type="secondary">
                {classes.find((c) => c.id === selectedClassId)?.name} · {students.length} 名学生
                {existingScores.length > 0 && <Tag style={{ marginLeft: 8 }}>已有 {existingScores.length} 条记录</Tag>}
              </Text>
            </Col>
            <Col>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>保存成绩</Button>
            </Col>
          </Row>
          <Table
            rowKey="id" columns={columns} dataSource={students}
            pagination={false} size="small" bordered
            scroll={{ x: 'max-content', y: 500 }}
          />
        </>
      )}

      {selectedClassId && students.length === 0 && (
        <Card size="small" className="card-flat">
          <Text type="secondary">该班级尚无在读学生</Text>
        </Card>
      )}
    </>
  );
}
