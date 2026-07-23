import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
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
          colorPrimary: '#5B8DEF',
          borderRadius: 8,
          colorBgLayout: '#F5F7FA',
          colorBgContainer: '#FFFFFF',
          colorBorderSecondary: '#E8ECF1',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
      }}
    >
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
    </ConfigProvider>
  );
}
