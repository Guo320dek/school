import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ClassManage = lazy(() => import('./pages/ClassManage'));
const CourseSetup = lazy(() => import('./pages/CourseSetup'));
const Timetable = lazy(() => import('./pages/Timetable'));
const ExamArrange = lazy(() => import('./pages/ExamArrange'));
const StaffArchive = lazy(() => import('./pages/StaffArchive'));
const Salary = lazy(() => import('./pages/Salary'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Announcement = lazy(() => import('./pages/Announcement'));
const SubjectManage = lazy(() => import('./pages/SubjectManage'));
const StudentRoster = lazy(() => import('./pages/StudentRoster'));
const SchoolCalendar = lazy(() => import('./pages/SchoolCalendar'));
const ScoreEntry = lazy(() => import('./pages/ScoreEntry'));
const ScoreAnalysis = lazy(() => import('./pages/ScoreAnalysis'));
const Homeroom = lazy(() => import('./pages/Homeroom'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
    <Spin size="large" />
  </div>
);

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

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
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LazyPage><PublicRoute><Login /></PublicRoute></LazyPage>} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<LazyPage><Dashboard /></LazyPage>} />
            <Route path="teaching/class" element={<LazyPage><ClassManage /></LazyPage>} />
            <Route path="teaching/course" element={<LazyPage><CourseSetup /></LazyPage>} />
            <Route path="teaching/subjects" element={<LazyPage><SubjectManage /></LazyPage>} />
            <Route path="teaching/students" element={<LazyPage><StudentRoster /></LazyPage>} />
            <Route path="teaching/timetable" element={<LazyPage><Timetable /></LazyPage>} />
            <Route path="teaching/exam" element={<LazyPage><ExamArrange /></LazyPage>} />
            <Route path="teaching/scores" element={<LazyPage><ScoreEntry /></LazyPage>} />
            <Route path="teaching/score-analysis" element={<LazyPage><ScoreAnalysis /></LazyPage>} />
            <Route path="homeroom" element={<LazyPage><Homeroom /></LazyPage>} />
            <Route path="calendar" element={<LazyPage><SchoolCalendar /></LazyPage>} />
            <Route path="hr/staff" element={<LazyPage><StaffArchive /></LazyPage>} />
            <Route path="hr/salary" element={<LazyPage><Salary /></LazyPage>} />
            <Route path="hr/attendance" element={<LazyPage><Attendance /></LazyPage>} />
            <Route path="parents/announcement" element={<LazyPage><Announcement /></LazyPage>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
