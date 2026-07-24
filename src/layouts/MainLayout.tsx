// 青云高级中学 — 管理系统
import { useMemo, useState } from 'react';
import { Layout, Menu, Tabs, theme, Button, Input, Modal, Drawer, Grid } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  NotificationOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
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

// Sidebar brand illustration SVG
const SidebarBrandIllustration = ({ visible }: { visible: boolean }) => (
  <div style={{
    padding: '20px 12px 16px', marginTop: 'auto',
    opacity: 0.5, transition: 'opacity 0.2s',
    textAlign: 'center',
  }}
    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; }}
  >
    <svg viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: visible ? 130 : 48, transition: 'width 0.2s' }}>
      <rect x="20" y="18" width="55" height="52" rx="4" stroke="#4062BB" strokeWidth="1.2" opacity="0.4"/>
      <rect x="28" y="26" width="16" height="16" rx="2" stroke="#4062BB" strokeWidth="1" opacity="0.25"/>
      <rect x="50" y="26" width="16" height="16" rx="2" stroke="#4062BB" strokeWidth="1" opacity="0.25"/>
      <rect x="28" y="46" width="38" height="16" rx="2" stroke="#4062BB" strokeWidth="1" opacity="0.25"/>
      <rect x="95" y="28" width="4" height="42" rx="2" fill="#4062BB" opacity="0.15"/>
      <circle cx="97" cy="22" r="7" stroke="#4062BB" strokeWidth="1.1" opacity="0.2"/>
      <circle cx="94" cy="19" r="2.5" fill="#4062BB" opacity="0.18"/>
      <circle cx="100" cy="21" r="2" fill="#4062BB" opacity="0.14"/>
      <circle cx="97" cy="25" r="1.5" fill="#4062BB" opacity="0.16"/>
    </svg>
  </div>
);

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { editable, unlock, lock } = usePermission();
  const [pwModal, setPwModal] = useState(false);
  const [pw, setPw] = useState('');
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  function handleUnlock() {
    if (unlock(pw)) { setPwModal(false); setPw(''); }
    else { setPw(''); }
  }

  const activeCategory = useMemo(() => {
    if (location.pathname === '/') return categories[0];
    return categories.find((c) => c.children?.some((ch) => location.pathname.startsWith(ch.key))) ?? categories[0];
  }, [location.pathname]);

  const subTabs = activeCategory.children;

  const menuItems = categories.map((c) => ({ key: c.key, icon: c.icon, label: c.label }));

  const sidebarMenu = (
    <>
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 600, color: token.colorPrimary,
        borderBottom: '1px solid #E8E2DC',
      }}>
        青云高级中学
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeCategory.key]}
        style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
        items={menuItems}
        onClick={({ key }) => {
          const cat = categories.find((c) => c.key === key);
          if (cat) { navigate(cat.path); setDrawerOpen(false); }
        }}
      />
      <SidebarBrandIllustration visible />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          theme="light"
          width={180}
          collapsedWidth={64}
          trigger={null}
          collapsed={collapsed}
          style={{
            borderRight: '1px solid #E8E2DC',
            background: '#FCFAF8',
          }}
        >
          <div style={{
            height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: collapsed ? 16 : 17, fontWeight: 600, color: token.colorPrimary,
            borderBottom: '1px solid #E8E2DC',
            overflow: 'hidden', whiteSpace: 'nowrap',
          }}>
            {collapsed ? '青云' : '青云高级中学'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeCategory.key]}
            style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
            items={menuItems}
            onClick={({ key }) => {
              const cat = categories.find((c) => c.key === key);
              if (cat) navigate(cat.path);
            }}
          />
          <SidebarBrandIllustration visible={!collapsed} />
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        width={200}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
        closable={false}
      >
        {sidebarMenu}
      </Drawer>

      <Layout>
        <Header style={{
          height: 60, padding: isMobile ? '0 12px' : '0 24px',
          background: '#fff',
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid #E8E2DC',
        }}>
          {isMobile ? (
            <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
          ) : (
            <Button
              shape="circle"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              size="small"
              style={{ border: '1px solid #E8E2DC', color: '#64748b' }}
            />
          )}
          <span style={{ fontSize: 15, fontWeight: 600, flex: 1, color: '#333' }}>{activeCategory.label}</span>
          <Button type="text" icon={editable ? <UnlockOutlined style={{ color: '#10B981' }} /> : <LockOutlined style={{ color: '#9CA3AF' }} />}
            onClick={() => editable ? lock() : setPwModal(true)} title={editable ? '点击锁定' : '解锁编辑'} />
        </Header>
        {subTabs && (
          <div style={{
            background: '#FCFAF8',
            borderBottom: '1px solid #E8E2DC',
            padding: isMobile ? '0 8px' : '0 20px',
            overflowX: 'auto',
          }}>
            <Tabs
              activeKey={location.pathname}
              onChange={(key) => navigate(key)}
              tabBarStyle={{ marginBottom: 0, whiteSpace: 'nowrap' }}
              size={isMobile ? 'small' : 'middle'}
              tabBarGutter={isMobile ? 12 : 24}
              items={subTabs.map((t) => ({ key: t.key, label: t.label }))}
            />
          </div>
        )}
        <Content style={{
          margin: isMobile ? 8 : 24,
          padding: isMobile ? 12 : 24,
          background: token.colorBgContainer,
          borderRadius: 8,
          minHeight: 280, overflow: 'auto',
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
