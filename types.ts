
// Views enumeration for navigation
export enum ViewName {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  TOOLS = 'TOOLS',
  DAILY = 'DAILY',
  RECORD = 'RECORD',
  ADMIN = 'ADMIN', // New Admin View
  // Sub-views
  BREATHING = 'BREATHING',
  TIMER = 'TIMER',
  STATS = 'STATS',
  RECORD_INPUT = 'RECORD_INPUT',
  COURSE_DETAIL = 'COURSE_DETAIL',
}

export type Language = 'zh' | 'en';

export enum CourseStatus {
  NOT_STARTED = '未开始',
  IN_PROGRESS = '进行中',
  ENDED = '已结束',
}

export interface CourseWeek {
  id: number;
  title: string;
  status: CourseStatus;
}

export enum TimerType {
  NIANFO = '念佛念经',
  BAIFO = '忆佛拜佛',
  ZENGHUI = '一念相续', 
  BREATH = '呼吸', 
}

export enum CheckInType {
  NONE = 'NONE',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export interface DailyStats {
  nianfo: number; // minutes
  baifo: number;
  zenghui: number;
  breath: number;
}

export interface GrowthRecord {
  id: number;
  type: string;
  content: string;
  time: string;
  color: string;
  bgColor: string;
  textColor: string;
  isPinned?: boolean;
}

// User Interface
export interface User {
  id: string;
  name: string;
  password?: string; // For mock auth
  isAdmin?: boolean;
  classVersion: string; // '1.0' or '2.0'
}

// Renamed and simplified: No more "Day" selection, just Leave status
export interface LeaveState {
  hasLeft: boolean;
  leaveReason: string;
  hasRevokedLeave: boolean; // Track if user has used their one-time revoke
}

// New Interface for Backend State (Snapshot of final status)
export interface UserWeeklyState {
  key: string; // composite key: userId_weekRange
  userId: string;
  userName: string;
  weekRange: string; // e.g. "10.20 - 10.26"
  leaveReason: string; // e.g. "事假" or ""
  checkInStatus: string; // e.g. "线下签到" or ""
  updatedAt: string; // ISO string
  hasRevokedLeave?: boolean; // Persist revoke status
}

export interface CheckInConfig {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  enabled: boolean;
  locationName?: string;
}

// Map course ID to content string. 
// Key format: `${version}-${weekId}` e.g., "1.0-1"
export type CourseContentMap = Record<string, string>;

export type CourseScheduleMap = Record<string, CourseWeek[]>;
