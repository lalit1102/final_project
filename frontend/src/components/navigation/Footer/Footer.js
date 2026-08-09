'use client';
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Typography } from 'antd';
import styles from './Footer.module.css';
const DashboardFooter = () => {
    const year = new Date().getFullYear();
    return (_jsx("footer", { className: styles.footer, role: "contentinfo", children: _jsxs(Typography.Text, { type: "secondary", className: styles.footerText, children: ["\u00A9 ", year, " LearnSphere"] }) }));
};
export default DashboardFooter;
