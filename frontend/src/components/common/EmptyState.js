import { jsx as _jsx } from "react/jsx-runtime";
import { Empty, Typography } from 'antd';
import styles from './EmptyState.module.css';
const EmptyState = ({ title: _title, description = 'There is nothing to display here.', }) => {
    return (_jsx("div", { className: styles.emptyContainer, children: _jsx(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: _jsx("div", { className: styles.emptyContent, children: _jsx(Typography.Text, { type: "secondary", className: styles.emptyDescription, children: description }) }) }) }));
};
export default EmptyState;
