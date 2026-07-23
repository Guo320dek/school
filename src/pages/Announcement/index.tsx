import { useState, useMemo } from 'react';
import { Button, Select, Modal, Form, Popconfirm, Input, DatePicker, Space, Tag, Card, Row, Col, Typography, message, List, Empty, Timeline } from 'antd';
import { PlusOutlined, NotificationOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { mockAnnouncements } from '../../mock/data';
import type { Announcement, AnnounceTarget } from '../../types';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const priorityColor: Record<string, string> = { '紧急': 'red', '重要': 'orange', '普通': 'blue' };
const targetColor: Record<string, string> = { '全体': 'purple', '高一': 'cyan', '高二': 'geekblue', '高三': 'blue' };
const targetIcon: Record<string, React.ReactNode> = { '全体': <TeamOutlined />, '高一': <span>I</span>, '高二': <span>II</span>, '高三': <span>III</span> };

function genId() { return String(Date.now()) + Math.random().toString(36).slice(2, 6); }

export default function Announcement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([...mockAnnouncements]);
  const [filterTarget, setFilterTarget] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form] = Form.useForm();

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      if (filterTarget && a.target !== filterTarget) return false;
      return true;
    }).sort((a, b) => {
      if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
      const pOrder: Record<string, number> = { '紧急': 0, '重要': 1, '普通': 2 };
      return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
    });
  }, [announcements, filterTarget]);

  const activeList = filtered.filter((a) => !a.isExpired);
  const expiredList = filtered.filter((a) => a.isExpired);

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ date: dayjs(), expireDate: dayjs().add(7, 'day') }); setModalOpen(true); }
  function openEdit(r: Announcement) { setEditing(r); form.setFieldsValue({ ...r, date: dayjs(r.date), expireDate: dayjs(r.expireDate) }); setModalOpen(true); }
  function handleDelete(id: string) { setAnnouncements((p) => p.filter((a) => a.id !== id)); message.success('已删除'); }

  function handleSave() {
    form.validateFields().then((v) => {
      const fmt = (d: Dayjs) => d.format('YYYY-MM-DD');
      const data: Announcement = { id: editing?.id ?? genId(), title: v.title, content: v.content, date: fmt(v.date), priority: v.priority, target: v.target, expireDate: fmt(v.expireDate), isExpired: dayjs().isAfter(v.expireDate) };
      if (editing) { setAnnouncements((p) => p.map((a) => a.id === editing.id ? data : a)); message.success('已更新'); }
      else { setAnnouncements((p) => [data, ...p]); message.success('已发布'); }
      setModalOpen(false);
    });
  }

  return (
    <>
      <Title level={4} style={{ marginBottom: 20, fontWeight: 600 }}>通知公告</Title>

      <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
        <Col flex="auto">
          <Space wrap>
            <Select placeholder="发送范围筛选" value={filterTarget} onChange={setFilterTarget} allowClear style={{ width: 150 }}
              options={[{ label: '全体', value: '全体' }, { label: '高一', value: '高一' }, { label: '高二', value: '高二' }, { label: '高三', value: '高三' }]}
              prefix={<TeamOutlined style={{ color: '#bbb' }} />} />
            <Tag color="green">有效 {activeList.length}</Tag>
            <Tag color="default">已过期 {expiredList.length}</Tag>
          </Space>
        </Col>
        <Col><Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>发布公告</Button></Col>
      </Row>

      <Row gutter={20}>
        <Col xs={24} lg={16}>
          <Card
            title={<Space><NotificationOutlined />有效公告</Space>}
            size="small" style={{ borderRadius: 8 }}
          >
            {activeList.length === 0 ? (
              <Empty description="暂无有效公告" />
            ) : (
              <List
                dataSource={activeList}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key="edit" type="link" size="small" onClick={() => openEdit(item)}>编辑</Button>,
                      <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(item.id)}>
                        <Button type="link" size="small" danger>删除</Button>
                      </Popconfirm>,
                    ]}
                    style={{ padding: '12px 0' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40, height: 40, borderRadius: 8, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          background: priorityColor[item.priority] === 'red' ? '#FFF1F0' :
                            priorityColor[item.priority] === 'orange' ? '#FFF7E6' : '#F0F5FF',
                          fontSize: 18,
                        }}>
                          <NotificationOutlined style={{ color: priorityColor[item.priority] === 'red' ? '#ff4d4f' : priorityColor[item.priority] === 'orange' ? '#faad14' : '#5B8DEF' }} />
                        </div>
                      }
                      title={
                        <Space size={8}>
                          <Tag color={priorityColor[item.priority]} style={{ borderRadius: 4, marginRight: 0 }}>{item.priority}</Tag>
                          <Tag color={targetColor[item.target]} style={{ borderRadius: 4 }}>{item.target}</Tag>
                          <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4, color: '#555', fontSize: 13 }}>
                            {item.content}
                          </Paragraph>
                          <Space size={12}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              <ClockCircleOutlined /> {item.date} 发布
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              有效期至 {item.expireDate}
                            </Text>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="已过期公告" size="small" style={{ borderRadius: 8 }}>
            {expiredList.length === 0 ? (
              <Empty description="暂无" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={expiredList}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <List.Item.Meta
                      title={<Text delete style={{ fontSize: 13, color: '#bbb' }}>{item.title}</Text>}
                      description={
                        <Space size={8} style={{ fontSize: 11 }}>
                          <Text type="secondary">{item.date}</Text>
                          <Tag color={targetColor[item.target]} style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>{item.target}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal title={editing ? '编辑公告' : '发布公告'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose width={580}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}><Input placeholder="输入公告标题" /></Form.Item>
          <Form.Item name="content" label="正文" rules={[{ required: true, message: '请输入正文内容' }]}>
            <Input.TextArea rows={4} placeholder="输入公告正文内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select options={[
                  { label: '普通', value: '普通' }, { label: '重要', value: '重要' }, { label: '紧急', value: '紧急' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="target" label="发送范围" rules={[{ required: true }]}>
                <Select options={[
                  { label: '全体师生', value: '全体' }, { label: '高一年级', value: '高一' },
                  { label: '高二年级', value: '高二' }, { label: '高三年级', value: '高三' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="date" label="发布日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="expireDate" label="过期日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} placeholder="选择公告过期日期" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
