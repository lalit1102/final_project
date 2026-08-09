import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Empty, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from './ErrorState.module.css';
const ErrorState = ({ title = 'Something went wrong', description = 'An error occurred while loading data.', onRetry, retryLabel = 'Retry', }) => {
    return (_jsx("div", { className: styles.errorContainer, children: _jsx(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, imageStyle: { height: 60 }, description: _jsxs("div", { className: styles.errorContent, children: [_jsx(Typography.Text, { type: "danger", className: styles.errorTitle, children: title }), _jsx(Typography.Text, { type: "secondary", className: styles.errorDescription, children: description }), onRetry && (_jsx(Button, { type: "primary", icon: _jsx(ReloadOutlined, {}), onClick: onRetry, className: styles.retryButton, children: retryLabel }))] }) }) }));
};
export default ErrorState;
