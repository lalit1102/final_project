import { jsx as _jsx } from "react/jsx-runtime";
import { Tag } from 'antd';
import styles from './StatusTag.module.css';
const statusPresetMap = {
    active: 'success',
    inactive: 'default',
    pending: 'processing',
    draft: 'warning',
    archived: 'default',
    published: 'success',
    error: 'error',
    success: 'success',
    warning: 'warning',
    info: 'processing',
    default: 'default',
};
const StatusTag = ({ status, label, variant = 'filled', bordered = false, }) => {
    const preset = statusPresetMap[String(status).toLowerCase()] ?? 'default';
    const tagProps = {
        bordered,
        className: styles.statusTag,
    };
    if (variant === 'dot') {
        tagProps.className = `${styles.statusTag} ${styles.dot}`;
    }
    const displayLabel = label ?? status;
    return (_jsx(Tag, { ...tagProps, color: preset, children: displayLabel }));
};
export default StatusTag;
