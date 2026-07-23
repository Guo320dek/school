import { useMemo, useState } from 'react';
import { Layout, Menu, Tabs, theme, Button, Input, Modal, Space } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  NotificationOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';

const { Header, Sider, Content } = Layout;

interface Category {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  children?: { key: string; label: string }[];
}

const categories: Category[] = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '业务版面', path: '/' },
  { key: 'teaching', icon: <BookOutlined />, label: '教学管理', path: '/teaching/class', children: [
    { key: '/teaching/class', label: '班级管理' },
    { key: '/teaching/course', label: '课程设置' },
    { key: '/teaching/timetable', label: '课表管理' },
    { key: '/teaching/exam', label: '考试安排' },
  ]},
  { key: 'hr', icon: <TeamOutlined />, label: '行政人事', path: '/hr/staff', children: [
    { key: '/hr/staff', label: '职工档案' },
    { key: '/hr/salary', label: '工资管理' },
    { key: '/hr/attendance', label: '考勤系统' },
  ]},
  { key: 'parents', icon: <NotificationOutlined />, label: '家校沟通', path: '/parents/announcement', children: [
    { key: '/parents/announcement', label: '通知公告' },
  ]},
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const { editable, unlock, lock } = usePermission();
  const [pwModal, setPwModal] = useState(false);
  const [pw, setPw] = useState('');

  function handleUnlock() {
    if (unlock(pw)) { setPwModal(false); setPw(''); }
    else { setPw(''); }
  }

  const activeCategory = useMemo(() => {
    if (location.pathname === '/') return categories[0];
    return categories.find((c) => c.children?.some((ch) => location.pathname.startsWith(ch.key))) ?? categories[0];
  }, [location.pathname]);

  const subTabs = activeCategory.children;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        width={180}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
        }}
      >
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: collapsed ? 14 : 16, fontWeight: 600, color: token.colorPrimary,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          {collapsed ? '青云' : '青云高级中学'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeCategory.key]}
          style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
          items={categories.map((c) => ({ key: c.key, icon: c.icon, label: c.label }))}
          onClick={({ key }) => {
            const cat = categories.find((c) => c.key === key);
            if (cat) navigate(cat.path);
          }}
        />
      </Sider>
      <Layout>
        <Header style={{
          height: 56, padding: '0 24px', background: token.colorBgContainer,
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 16, width: 40, height: 40 }} />
          <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{activeCategory.label}</span>
          <Button type="text" icon={editable ? <UnlockOutlined style={{ color: '#10B981' }} /> : <LockOutlined style={{ color: '#9CA3AF' }} />}
            onClick={() => editable ? lock() : setPwModal(true)} title={editable ? '点击锁定' : '解锁编辑'} />
        </Header>
        {subTabs && (
          <div style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '0 20px',
          }}>
            <Tabs
              activeKey={location.pathname}
              onChange={(key) => navigate(key)}
              tabBarStyle={{ marginBottom: 0 }}
              size="middle"
              items={subTabs.map((t) => ({ key: t.key, label: t.label }))}
            />
          </div>
        )}
        <Content style={{
          margin: 20, padding: 24, background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG, minHeight: 280, overflow: 'auto',
        }}>
          <Outlet />
        </Content>
      </Layout>
      <Modal title="解锁编辑" open={pwModal} onOk={handleUnlock} onCancel={() => setPwModal(false)} width={300}>
        <Input.Password placeholder="请输入管理密码" value={pw} onChange={(e) => setPw(e.target.value)} onPressEnter={handleUnlock} />
      </Modal>
    </Layout>
  );
}
