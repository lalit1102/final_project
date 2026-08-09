import { jsx as _jsx } from "react/jsx-runtime";
import { DashboardOutlined, UserOutlined, BookOutlined, TeamOutlined, SettingOutlined, FileTextOutlined, BarChartOutlined, } from '@ant-design/icons';
export const iconMap = {
    dashboard: _jsx(DashboardOutlined, {}),
    user: _jsx(UserOutlined, {}),
    users: _jsx(TeamOutlined, {}),
    teacher: _jsx(UserOutlined, {}),
    teachers: _jsx(TeamOutlined, {}),
    student: _jsx(UserOutlined, {}),
    students: _jsx(TeamOutlined, {}),
    course: _jsx(BookOutlined, {}),
    courses: _jsx(BookOutlined, {}),
    exam: _jsx(FileTextOutlined, {}),
    exams: _jsx(FileTextOutlined, {}),
    grade: _jsx(BarChartOutlined, {}),
    grades: _jsx(BarChartOutlined, {}),
    attendance: _jsx(FileTextOutlined, {}),
    announcement: _jsx(FileTextOutlined, {}),
    announcements: _jsx(FileTextOutlined, {}),
    setting: _jsx(SettingOutlined, {}),
    settings: _jsx(SettingOutlined, {}),
};
