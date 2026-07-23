import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { PermissionProvider } from './contexts/PermissionContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ClassManage from './pages/ClassManage';
import CourseSetup from './pages/CourseSetup';
import Timetable from './pages/Timetable';
import ExamArrange from './pages/ExamArrange';
import StaffArchive from './pages/StaffArchive';
import Salary from './pages/Salary';
import Attendance from './pages/Attendance';
import Announcement from './pages/Announcement';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4F6EF7',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 10,
          borderRadiusLG: 12,
          colorBgLayout: '#F0F2F5',
          colorBgContainer: '#FFFFFF',
          colorBorderSecondary: '#E5E7EB',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          boxShadowSecondary: '0 2px 8px rgba(0,0,0,0.08)',
        },
        components: {
          Card: {
            borderRadiusLG: 14,
            paddingLG: 24,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Menu: {
            itemBorderRadius: 8,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 34,
          },
        },
      }}
    >
      <PermissionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="teaching/class" element={<ClassManage />} />
              <Route path="teaching/course" element={<CourseSetup />} />
              <Route path="teaching/timetable" element={<Timetable />} />
              <Route path="teaching/exam" element={<ExamArrange />} />
              <Route path="hr/staff" element={<StaffArchive />} />
              <Route path="hr/salary" element={<Salary />} />
              <Route path="hr/attendance" element={<Attendance />} />
              <Route path="parents/announcement" element={<Announcement />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PermissionProvider>
    </ConfigProvider>
  );
}
