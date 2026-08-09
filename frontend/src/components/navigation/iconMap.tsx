import type { ReactNode } from 'react';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

export const iconMap: Record<string, ReactNode> = {
  dashboard: <DashboardOutlined />,
  user: <UserOutlined />,
  users: <TeamOutlined />,
  teacher: <UserOutlined />,
  teachers: <TeamOutlined />,
  student: <UserOutlined />,
  students: <TeamOutlined />,
  course: <BookOutlined />,
  courses: <BookOutlined />,
  exam: <FileTextOutlined />,
  exams: <FileTextOutlined />,
  grade: <BarChartOutlined />,
  grades: <BarChartOutlined />,
  attendance: <FileTextOutlined />,
  announcement: <FileTextOutlined />,
  announcements: <FileTextOutlined />,
  setting: <SettingOutlined />,
  settings: <SettingOutlined />,
};
