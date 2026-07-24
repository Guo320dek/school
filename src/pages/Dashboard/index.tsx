import { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Tag, Space, Button, Avatar } from 'antd';
import { useSplitText } from '../../utils/animations';
import {
  TeamOutlined, BookOutlined, DollarOutlined, ClockCircleOutlined,
  BankOutlined, NotificationOutlined, ArrowUpOutlined, ArrowDownOutlined,
  MinusOutlined, RightOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getSchool, getMetrics, getAnnouncements, getAttendance } from '../../api';
import { useRealtime } from '../../hooks/useRealtime';
import type { School, BusinessMetric, Announcement, AttendanceRecord } from '../../types';
import dayjs from 'dayjs';

// Tokens synthesized from shigaku-tokyo.or.jp + 7-kou.jp
const T = {
  bg:'#FCFAF8', surface:'#fff', warm:'#FFFDFB', text:'#333', muted:'#64748b',
  accent:'#4062BB', accentLight:'#84B1EA', teal:'#128068', border:'#E8E2DC',
  warn:'#F59E0B', danger:'#EF4444',
};

const iconMap: Record<string, React.ReactNode> = {
  'book': <BookOutlined />, 'team': <TeamOutlined />, 'student': <TeamOutlined />,
  'dollar': <DollarOutlined />, 'clock': <ClockCircleOutlined />, 'warning': <ExclamationCircleOutlined />,
};

// ---- CountUp hook: animate numeric value from 0 to target ----
function useCountUp(target: number, duration = 1400, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const animate = useCallback(() => {
    startTimeRef.current = performance.now();
    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(decimals > 0
        ? parseFloat((target * eased).toFixed(decimals))
        : Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [target, duration, decimals]);

  useEffect(() => {
    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return value;
}

// ---- MetricCard with CountUp ----
function MetricCard({ m, index }: { m: BusinessMetric; index: number }) {
  const countValue = useCountUp(m.value, 1400, 0);
  const displayValue = countValue;

  return (
    <Col xs={12} sm={8} md={4}
      style={{ animation: `fadeUpIn 0.5s ease forwards`, animationDelay: `${0.05 + index * 0.05}s`, opacity: 0 }}>
      <div style={{
        background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`,
        padding: '20px 16px 18px', transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
        className="metric-card-hover"
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
      >
        <span style={{
          display: 'inline-flex', width: 44, height: 44, borderRadius: 12,
          background: '#EDEFF8', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12, fontSize: 20, color: T.accent,
          transition: 'transform 0.2s ease, background 0.2s',
        }} className="metric-icon">
          {iconMap[m.icon]}
        </span>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, letterSpacing: '0.02em', marginBottom: 6 }}>{m.title}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>
          {displayValue}<span style={{ fontSize: 14, fontWeight: 400, color: T.muted, marginLeft: 2 }}>{m.unit}</span>
        </div>
        {m.trend && (
          <div style={{ marginTop: 8 }}>
            {m.trend === 'up' ? <span style={{ fontSize: 11, color: T.danger }}><ArrowUpOutlined /></span>
              : m.trend === 'down' ? <span style={{ fontSize: 11, color: T.teal }}><ArrowDownOutlined /></span>
                : <span style={{ fontSize: 11, color: T.muted }}><MinusOutlined /></span>}
          </div>
        )}
      </div>
    </Col>
  );
}

// ---- Hero Illustration SVG ----
const HeroIllustration = () => (
  <div style={{ flex: '0 0 300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 340, opacity: 0.85 }}>
      {/* Desk */}
      <rect x="40" y="210" width="220" height="12" rx="4" fill="rgba(64,98,187,0.12)"/>
      <rect x="55" y="222" width="8" height="70" rx="2" fill="rgba(64,98,187,0.08)"/>
      <rect x="237" y="222" width="8" height="70" rx="2" fill="rgba(64,98,187,0.08)"/>
      {/* Open book left page */}
      <path d="M95 175 L95 210 L150 215 L150 178 Z" fill="rgba(64,98,187,0.14)" stroke="rgba(64,98,187,0.18)" strokeWidth="1"/>
      <path d="M150 178 L150 215 L205 210 L205 175 Z" fill="rgba(64,98,187,0.09)" stroke="rgba(64,98,187,0.18)" strokeWidth="1"/>
      <line x1="108" y1="185" x2="142" y2="188" stroke="rgba(64,98,187,0.18)" strokeWidth="1.5"/>
      <line x1="106" y1="193" x2="143" y2="196" stroke="rgba(64,98,187,0.18)" strokeWidth="1.5"/>
      <line x1="155" y1="188" x2="195" y2="185" stroke="rgba(64,98,187,0.12)" strokeWidth="1.5"/>
      {/* Student head */}
      <circle cx="150" cy="85" r="32" fill="rgba(64,98,187,0.1)" stroke="rgba(64,98,187,0.16)" strokeWidth="1.5"/>
      <path d="M118 75 Q120 45 150 42 Q180 45 182 75 Q180 55 150 52 Q120 55 118 75" fill="rgba(64,98,187,0.08)"/>
      {/* Body */}
      <path d="M118 117 Q120 105 150 100 Q180 105 182 117 L180 175 Q165 178 150 178 Q135 178 120 175 Z" fill="rgba(64,98,187,0.07)" stroke="rgba(64,98,187,0.12)" strokeWidth="1"/>
      {/* Window */}
      <rect x="248" y="40" width="80" height="100" rx="6" fill="rgba(64,98,187,0.04)" stroke="rgba(64,98,187,0.1)" strokeWidth="1.5"/>
      <line x1="288" y1="40" x2="288" y2="140" stroke="rgba(64,98,187,0.07)" strokeWidth="1"/>
      <line x1="248" y1="80" x2="328" y2="80" stroke="rgba(64,98,187,0.07)" strokeWidth="1"/>
      <circle cx="280" cy="65" r="10" fill="rgba(64,98,187,0.08)"/>
      <path d="M310 135 Q315 110 310 95 Q320 100 325 90 Q330 100 328 115 Q325 135 310 135" fill="rgba(64,98,187,0.05)"/>
      {/* Floating academic shapes */}
      <rect x="58" y="55" width="28" height="4" rx="2" fill="rgba(64,98,187,0.05)" transform="rotate(-12 72 57)"/>
      <rect x="240" y="168" width="18" height="3" rx="1.5" fill="rgba(64,98,187,0.04)" transform="rotate(8 249 169)"/>
    </svg>
  </div>
);

// ---- Main Dashboard ----
export default function Dashboard() {
  const navigate = useNavigate();
  const [schoolInfo, setSchoolInfo] = useState<School | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetric[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    getSchool().then(setSchoolInfo).catch(console.error);
    getMetrics().then(setMetrics).catch(console.error);
    getAnnouncements().then(setAnnouncements).catch(console.error);
    getAttendance().then(setAttendance).catch(console.error);
    // Trigger hero illustration entrance after mount
    setTimeout(() => setHeroVisible(true), 200);
  }, []);
  useRealtime('announcements', () => { getAnnouncements().then(setAnnouncements).catch(console.error); });
  useRealtime('attendance_records', () => { getAttendance().then(setAttendance).catch(console.error); });

  const active = announcements.filter((a) => !a.isExpired);
  const today = dayjs().format('YYYY-MM-DD');
  const todayAttendance = attendance.filter((a) => a.date === today);

  useSplitText('#hero-title', { stagger: 0.03 });

  if (!schoolInfo) return null;

  return (
    <>
      {/* ===== HERO — with student illustration ===== */}
      <div style={{
        position:'relative', overflow:'hidden', minHeight:520, borderRadius: 20, marginBottom: 36,
        background: `linear-gradient(150deg, #FCFAF8 0%, #F0EEF8 40%, #E8E9F5 100%)`,
        backgroundSize: '300% 300%',
        animation: 'heroShift 14s ease infinite',
        border: '1px solid rgba(64,98,187,0.06)',
      }}>
        {/* Decorative background circles */}
        <div style={{position:'absolute',top:-80,right:-40,width:320,height:320,borderRadius:'50%',border:'2px solid rgba(64,98,187,0.04)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:-50,left:-20,width:200,height:200,borderRadius:'50%',background:'rgba(132,177,234,0.04)',pointerEvents:'none'}}/>

        <div style={{
          position:'relative',zIndex:1,padding:'52px 48px 44px',
          display:'flex',alignItems:'center',minHeight:520,flexWrap:'wrap',gap:32
        }}>
          <div style={{flex:'1 1 380px',minWidth:280}}>
            <div style={{fontSize:13,fontWeight:600,color:T.accent,letterSpacing:'0.1em',marginBottom:16,textTransform:'uppercase'}}>
              SCHOOL MANAGEMENT
            </div>
            <h1 id="hero-title" style={{fontSize:40,fontWeight:800,lineHeight:1.2,color:'#2D2D3A',margin:'0 0 20px',letterSpacing:'-0.025em'}}>
              {schoolInfo.name}
            </h1>
            <div style={{display:'flex',gap:28,flexWrap:'wrap',marginBottom:28}}>
              {[
                {label:'在读学生',value:schoolInfo.studentCount},
                {label:'教职工',value:schoolInfo.staffCount},
                {label:'学校类型',value:schoolInfo.type},
              ].map(s=>(
                <div key={s.label}>
                  <div style={{fontSize:26,fontWeight:700,color:T.accent,lineHeight:1.1}}>{s.value}</div>
                  <div style={{fontSize:12,color:T.muted,marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
            <Space size={12} wrap>
              <Button type="primary" size="large" onClick={()=>navigate('/teaching/class')}
                style={{height:44,paddingInline:28,fontWeight:600,fontSize:15}}>
                班级管理
              </Button>
              <Button size="large" onClick={()=>navigate('/hr/staff')}
                style={{height:44,paddingInline:28,borderColor:T.border}}>
                职工档案
              </Button>
            </Space>
          </div>
          {/* Hero illustration with fade-in */}
          <div style={{
            flex:'0 0 280px', opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateX(0)' : 'translateX(20px)',
            transition: 'opacity 0.7s 0.3s ease, transform 0.7s 0.3s ease',
          }}>
            <HeroIllustration />
          </div>
        </div>

        {/* Bottom stat bar */}
        <div style={{position:'relative',zIndex:1,display:'flex',borderTop:'1px solid rgba(0,0,0,0.06)',margin:'0 48px'}}>
          {[{label:'学生',value:schoolInfo.studentCount},{label:'教职工',value:schoolInfo.staffCount},{label:'班级',value:'18'},{label:'课程',value:'24'}].map((s,i)=>(
            <div key={s.label} style={{flex:1,padding:'16px 0',textAlign:'center',borderRight:i<3?'1px solid rgba(0,0,0,0.04)':'none'}}>
              <div style={{fontSize:22,fontWeight:700,color:T.accent,lineHeight:1.2}}>{s.value}</div>
              <div style={{fontSize:12,color:T.muted,marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== METRICS — with CountUp animation ===== */}
      <Row gutter={[16,16]} style={{marginBottom:36}}>
        {metrics.map((m,i) => (
          <MetricCard key={m.title} m={m} index={i} />
        ))}
      </Row>

      {/* ===== ATTENDANCE + ANNOUNCEMENTS ===== */}
      <Row gutter={24}>
        <Col xs={24} lg={12} style={{marginBottom:24}}>
          <div style={{background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,overflow:'hidden'}}>
            <div style={{padding:'18px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <Space><ClockCircleOutlined style={{color:T.accent,fontSize:17}}/>
                <span style={{fontSize:15,fontWeight:600,color:T.text}}>今日考勤</span>
                <Tag color="blue" style={{marginLeft:6}}>{today}</Tag>
              </Space>
              <Button type="link" size="small" onClick={()=>navigate('/hr/attendance')}>全部 <RightOutlined style={{fontSize:10}}/></Button>
            </div>
            <div style={{padding:'10px 24px 18px'}}>
              {todayAttendance.length===0?(
                <div style={{textAlign:'center',padding:36,color:T.muted,fontSize:13}}>
                  <svg viewBox="0 0 80 60" fill="none" style={{width:60,height:45,opacity:0.2,marginBottom:10,display:'block',margin:'0 auto 10px'}}>
                    <rect x="8" y="8" width="64" height="44" rx="4" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="40" cy="30" r="12" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M40 22 L40 30 L48 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  暂无考勤
                </div>
              ):todayAttendance.slice(0,6).map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',
                  borderBottom:i<todayAttendance.slice(0,6).length-1?`1px solid ${T.border}`:'none'}}>
                  <Avatar size={34} style={{background:item.status==='正常'?'#ECFDF5':item.status==='迟到'?'#FFFBEB':'#FEF2F2',
                    color:item.status==='正常'?T.teal:item.status==='迟到'?T.warn:T.danger,fontWeight:600,flexShrink:0}}>
                    {item.staffName[0]}
                  </Avatar>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:500}}>{item.staffName}</div>
                    <div style={{fontSize:12,color:T.muted}}>{item.checkIn??'--'} ~ {item.checkOut??'--'}</div>
                  </div>
                  <Tag color={item.status==='正常'?'green':item.status==='迟到'?'orange':'red'}
                    style={{margin:0,fontSize:11}}>{item.status}</Tag>
                </div>
              ))}
            </div>
          </div>
        </Col>
        <Col xs={24} lg={12} style={{marginBottom:24}}>
          <div style={{background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,overflow:'hidden'}}>
            <div style={{padding:'18px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <Space><NotificationOutlined style={{color:T.accent,fontSize:17}}/>
                <span style={{fontSize:15,fontWeight:600,color:T.text}}>最新公告</span>
              </Space>
              <Button type="link" size="small" onClick={()=>navigate('/parents/announcement')}>全部 <RightOutlined style={{fontSize:10}}/></Button>
            </div>
            <div style={{padding:'10px 24px 18px'}}>
              {active.length===0?(
                <div style={{textAlign:'center',padding:36,color:T.muted,fontSize:13}}>
                  <NotificationOutlined style={{fontSize:32,marginBottom:12,display:'block',opacity:0.2}}/>暂无公告
                </div>
              ):active.slice(0,6).map((item,i)=>(
                <div key={i} style={{padding:'12px 0',borderBottom:i<active.slice(0,6).length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                    <div style={{width:8,height:8,borderRadius:'50%',marginTop:6,flexShrink:0,
                      background:item.priority==='紧急'?T.danger:item.priority==='重要'?T.warn:T.accent}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                        <span style={{display:'inline-block',borderRadius:30,padding:'1px 10px',fontSize:11,fontWeight:500,
                          background:item.priority==='紧急'?'#FEF2F2':item.priority==='重要'?'#FFFBEB':'#EEF2FF',
                          color:item.priority==='紧急'?T.danger:item.priority==='重要'?T.warn:T.accent}}>
                          {item.priority}
                        </span>
                        <span style={{display:'inline-block',borderRadius:30,padding:'1px 10px',fontSize:11,fontWeight:500,
                          background:'#F5F3F0',color:T.muted}}>{item.target}</span>
                        <span style={{fontSize:14,fontWeight:500}}>{item.title}</span>
                      </div>
                      <div style={{fontSize:12,color:T.muted}}>{item.date} · 有效期至 {item.expireDate}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      <style>{`
        @keyframes heroShift {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fadeUpIn {
          from { opacity:0; transform:translateY(16px); }
          to { opacity:1; transform:translateY(0); }
        }
        .metric-card-hover:hover .metric-icon {
          transform: scale(1.08);
          background: rgba(64,98,187,0.12) !important;
        }
      `}</style>
    </>
  );
}
