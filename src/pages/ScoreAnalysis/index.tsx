import { useState, useEffect, useMemo } from 'react';
import { Select, Card, Table, Typography, Tag, Row, Col, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TrophyOutlined } from '@ant-design/icons';
import { getExams, getScoreSummary, getScores } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import type { Exam, ScoreSummary, ExamScore } from '../../types';

const { Title, Text } = Typography;

interface ClassScoreRow extends ScoreSummary {
  passRate: number;
  excellentRate: number;
}

export default function ScoreAnalysis() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [summary, setSummary] = useState<ClassScoreRow[]>([]);
  const [allScores, setAllScores] = useState<ExamScore[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getExams().then(setExams).catch(() => {}); }, []);
  useRealtime('exam_scores', () => { if (selectedExamId) loadData(); });

  const loadData = () => {
    if (!selectedExamId) return;
    setLoading(true);
    Promise.all([
      getScoreSummary(selectedExamId),
      getScores({ examId: selectedExamId }),
    ]).then(([sum, scores]) => {
      setAllScores(scores);
      setSummary(sum.map((s) => {
        const classScores = scores.filter((x) => x.subjectId === s.subjectId && x.classId === s.classId);
        const passRate = classScores.length > 0 ? Math.round((classScores.filter((x) => x.score >= 60).length / classScores.length) * 100) : 0;
        const excellentRate = classScores.length > 0 ? Math.round((classScores.filter((x) => x.score >= 85).length / classScores.length) * 100) : 0;
        return { ...s, passRate, excellentRate };
      }));
      setLoading(false);
    }).catch(() => { setLoading(false); });
  };

  const groupedBySubject = useMemo(() => {
    const groups: Record<string, { subjectName: string; rows: ClassScoreRow[] }> = {};
    summary.forEach((r) => {
      if (!groups[r.subjectId]) groups[r.subjectId] = { subjectName: r.subjectName, rows: [] };
      groups[r.subjectId].rows.push(r);
    });
    return Object.entries(groups).sort((a, b) => a[1].subjectName.localeCompare(b[1].subjectName));
  }, [summary]);

  const columns: ColumnsType<ClassScoreRow> = [
    { title: '班级', dataIndex: 'className', width: 120, fixed: 'left' as const },
    { title: '人数', dataIndex: 'count', width: 70, align: 'center' as const },
    {
      title: '平均分', dataIndex: 'avgScore', width: 100, align: 'center' as const,
      render: (v: number) => <Text strong style={{ color: v >= 70 ? '#128068' : v >= 60 ? '#4062BB' : '#EF4444' }}>{v}</Text>,
    },
    { title: '最高分', dataIndex: 'maxScore', width: 80, align: 'center' as const, render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: '最低分', dataIndex: 'minScore', width: 80, align: 'center' as const, render: (v: number) => <Tag color="red">{v}</Tag> },
    {
      title: '及格率', dataIndex: 'passRate', width: 100, align: 'center' as const,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v >= 80 ? '#128068' : '#4062BB'} />,
    },
    {
      title: '优秀率', dataIndex: 'excellentRate', width: 100, align: 'center' as const,
      render: (v: number) => <Progress percent={v} size="small" strokeColor="#F59E0B" />,
    },
  ];

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>
        <TrophyOutlined style={{ marginRight: 8 }} />成绩分析
      </Title>

      <Card size="small" className="card-flat" style={{ marginBottom: 20 }}>
        <Select placeholder="选择考试" value={selectedExamId || undefined} onChange={(v) => { setSelectedExamId(v); setTimeout(() => v && loadData(), 0); }}
          style={{ width: 260 }}
          options={exams.map((e) => ({ label: `${e.name} (${e.grade})`, value: e.id }))} />
        <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
          提示：请先在「成绩录入」中录入成绩后再查看分析
        </Text>
      </Card>

      {groupedBySubject.length === 0 && selectedExamId && !loading && (
        <Card size="small" className="card-flat">
          <Text type="secondary">该考试暂无成绩数据</Text>
        </Card>
      )}

      {groupedBySubject.map(([subId, { subjectName, rows }]) => (
        <Card key={subId} size="small" className="card-flat" style={{ marginBottom: 20 }}
          title={<Text strong style={{ fontSize: 15 }}>{subjectName}</Text>}
          loading={loading}
        >
          <Table rowKey="classId" columns={columns} dataSource={rows} pagination={false} size="small" bordered />

          {/* Per-class score distribution */}
          {rows.map((r) => {
            const classScores = allScores.filter(
              (s) => s.subjectId === subId && s.classId === r.classId
            ).map((s) => s.score).sort((a, b) => a - b);
            if (classScores.length === 0) return null;
            const buckets = [0, 6, 5, 4, 3, 2, 1, 0];
            classScores.forEach((s) => {
              const i = s >= 90 ? 0 : s >= 80 ? 1 : s >= 70 ? 2 : s >= 60 ? 3 : s >= 50 ? 4 : s >= 40 ? 5 : 6;
              buckets[i]++;
            });
            return (
              <Row key={r.classId} align="middle" style={{ marginTop: 12, padding: '8px 12px', background: '#FAFAFA', borderRadius: 8 }}>
                <Col span={4}><Text style={{ fontSize: 13 }}>{r.className}</Text></Col>
                <Col span={20}>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((grade, i) => (
                      <div key={grade} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '100%', maxWidth: 28,
                          height: Math.max(2, (buckets[i] / classScores.length) * 120),
                          background: ['#128068', '#4062BB', '#84B1EA', '#F59E0B', '#F97316', '#EF4444', '#DC2626'][i],
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.3s ease',
                        }} />
                        <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                          {['90+', '80-89', '70-79', '60-69', '50-59', '40-49', '<40'][i]}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            );
          })}
        </Card>
      ))}
    </>
  );
}
