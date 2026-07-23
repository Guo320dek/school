import { Row, Col, Card, Statistic, List, Tag, Typography, Space, Descriptions, Button, Avatar } from 'antd';
import {
  TeamOutlined, BookOutlined, DollarOutlined, ClockCircleOutlined,
  BankOutlined, NotificationOutlined, ArrowUpOutlined, ArrowDownOutlined,
  MinusOutlined, RightOutlined, ExclamationCircleOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { schoolInfo, mockMetrics, mockAnnouncements, mockAttendance } from '../../mock/data';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const iconMap: Record<string, React.ReactNode> = {
  'book': <BookOutlined />, 'team': <TeamOutlined />, 'student': <TeamOutlined />,
  'dollar': <DollarOutlined />, 'clock': <ClockCircleOutlined />, 'warning': <ExclamationCircleOutlined />,
};

const priorityColor: Record<string, string> = { '紧急': 'red', '重要': 'orange', '普通': 'blue' };
const targetColor: Record<string, string> = { '全体': 'purple', '高一': 'cyan', '高二': 'geekblue', '高三': 'blue' };

export default function Dashboard() {
  const navigate = useNavigate();
  const active = mockAnnouncements.filter((a) => !a.isExpired);
  const today = dayjs().format('YYYY-MM-DD');
  const todayAttendance = mockAttendance.filter((a) => a.date === today);

  return (
    <>
      {/* === 学校简介 === */}
      <Card
        style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ display: 'flex' }}>
          {/* 照片占位区 */}
          <div style={{
            width: 280, minHeight: 180, background: 'linear-gradient(135deg, #E8F0FE 0%, #D4E4FC 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <div style={{ textAlign: 'center' }}>
              <BankOutlined style={{ fontSize: 56, color: '#5B8DEF', opacity: 0.6 }} />
              <div style={{ marginTop: 8, color: '#5B8DEF', fontSize: 14, opacity: 0.7 }}>学校照片</div>
            </div>
          </div>
          {/* 信息区 */}
          <div style={{ flex: 1, padding: 24 }}>
            <Title level={3} style={{ marginBottom: 16, fontWeight: 600 }}>{schoolInfo.name}</Title>
            <Descriptions column={2} size="small" colon={false}>
              <Descriptions.Item label={<Space><EnvironmentOutlined style={{ color: '#999' }} />地址</Space>}>
                {schoolInfo.address}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><PhoneOutlined style={{ color: '#999' }} />电话</Space>}>
                {schoolInfo.phone}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><UserOutlined style={{ color: '#999' }} />联系人</Space>}>
                {schoolInfo.contact}
              </Descriptions.Item>
              <Descriptions.Item label="类型">{schoolInfo.type} · 高中</Descriptions.Item>
              <Descriptions.Item label="在校学生">
                <Text strong style={{ color: '#5B8DEF', fontSize: 15 }}>{schoolInfo.studentCount}</Text> 人
              </Descriptions.Item>
              <Descriptions.Item label="教职工">
                <Text strong style={{ color: '#5B8DEF', fontSize: 15 }}>{schoolInfo.staffCount}</Text> 人
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <Space>
                <Button size="small" onClick={() => navigate('/teaching/class')}>班级管理</Button>
                <Button size="small" onClick={() => navigate('/hr/staff')}>职工档案</Button>
                <Button size="small" type="primary" onClick={() => navigate('/parents/announcement')}>发布公告</Button>
              </Space>
            </div>
          </div>
        </div>
      </Card>

      {/* === 指标卡片 === */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {mockMetrics.map((m) => (
          <Col xs={12} sm={8} lg={4} key={m.title}>
            <Card size="small" hoverable style={{ borderRadius: 10, textAlign: 'center', border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 24, color: '#5B8DEF', marginBottom: 8 }}>{iconMap[m.icon]}</div>
              <Statistic
                title={m.title} value={m.value} suffix={m.unit}
                valueStyle={{ fontSize: 24, fontWeight: 600, color: '#333' }}
                prefix={
                  m.trend === 'up' ? <ArrowUpOutlined style={{ color: '#cf1322', fontSize: 14 }} /> :
                  m.trend === 'down' ? <ArrowDownOutlined style={{ color: '#3f8600', fontSize: 14 }} /> :
                  <MinusOutlined style={{ color: '#5B8DEF', fontSize: 14 }} />
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* === 下半区：今日考勤 + 最新公告 === */}
      <Row gutter={20}>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={<Space><ClockCircleOutlined style={{ color: '#5B8DEF' }} />今日考勤概览 <Tag>{today}</Tag></Space>}
            style={{ borderRadius: 10 }}
          >
            {todayAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#bbb' }}>今日暂无考勤记录</div>
            ) : (
              <List size="small" dataSource={todayAttendance.slice(0, 6)}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <Space>
                      <Avatar size={28} style={{ background: item.status === '正常' ? '#f6ffed' : item.status === '迟到' ? '#fff7e6' : '#fff2f0', color: item.status === '正常' ? '#52c41a' : item.status === '迟到' ? '#fa8c16' : '#ff4d4f' }}>
                        {item.staffName[0]}
                      </Avatar>
                      <div>
                        <div style={{ fontSize: 13 }}>{item.staffName}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          {item.checkIn ?? '--'} ~ {item.checkOut ?? '--'}
                          <Tag color={item.status === '正常' ? 'green' : item.status === '迟到' ? 'orange' : 'red'} style={{ marginLeft: 6, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>{item.status}</Tag>
                        </div>
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            )}
            <Button type="link" size="small" onClick={() => navigate('/hr/attendance')} style={{ padding: 0 }}>
              查看全部考勤 <RightOutlined />
            </Button>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={<Space><NotificationOutlined style={{ color: '#5B8DEF' }} />最新公告</Space>}
            style={{ borderRadius: 10 }}
          >
            <List size="small" dataSource={active.slice(0, 6)}
              renderItem={(item) => (
                <List.Item style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <List.Item.Meta
                    title={
                      <Space size={6}>
                        <Tag color={priorityColor[item.priority]} style={{ borderRadius: 4, fontSize: 11 }}>{item.priority}</Tag>
                        <Tag color={targetColor[item.target]} style={{ borderRadius: 4, fontSize: 11 }}>{item.target}</Tag>
                        <Text style={{ fontSize: 13 }}>{item.title}</Text>
                      </Space>
                    }
                    description={<Text type="secondary" style={{ fontSize: 11 }}>{item.date} · 有效期至 {item.expireDate}</Text>}
                  />
                </List.Item>
              )}
            />
            <Button type="link" size="small" onClick={() => navigate('/parents/announcement')} style={{ padding: 0 }}>
              查看全部 <RightOutlined />
            </Button>
          </Card>
        </Col>
      </Row>
    </>
  );
}
