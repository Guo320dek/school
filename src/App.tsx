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
          colorPrimary: '#4062BB',
          colorInfo: '#4062BB',
          colorSuccess: '#128068',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 30,
          borderRadiusLG: 12,
          colorBgLayout: '#FCFAF8',
          colorBgContainer: '#ffffff',
          colorBorderSecondary: '#E8E2DC',
          boxShadow: 'none',
          boxShadowSecondary: 'none',
          colorText: '#333333',
          colorTextSecondary: '#64748b',
        },
        components: {
          Card: { borderRadiusLG: 8, paddingLG: 24 },
          Tag: { borderRadiusSM: 30 },
          Menu: {
            itemBorderRadius: 30, itemMarginInline: 4,
            itemSelectedBg: 'rgba(64,98,187,0.08)',
            itemActiveBg: 'rgba(64,98,187,0.04)',
            itemColor: '#555', itemSelectedColor: '#4062BB',
          },
          Button: {
            borderRadius: 30, controlHeight: 36, controlHeightSM: 30,
            defaultBorderColor: '#E8E2DC',
          },
          Tabs: {
            inkBarColor: '#4062BB',
            itemActiveColor: '#4062BB', itemHoverColor: '#4062BB', itemSelectedColor: '#4062BB',
          },
          Table: {
            headerBg: '#FCFAF8', headerColor: '#64748b',
            borderColor: '#E8E2DC', rowHoverBg: '#FFFDFB',
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
