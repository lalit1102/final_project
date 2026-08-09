import { jsx as _jsx } from "react/jsx-runtime";
import { Spin } from 'antd';
import styles from './LoadingState.module.css';
const LoadingState = ({ tip = 'Loading...', fullScreen = false, }) => {
    const content = _jsx(Spin, { size: "large", tip: tip });
    if (fullScreen) {
        return _jsx("div", { className: styles.fullScreenContainer, children: content });
    }
    return _jsx("div", { className: styles.container, children: content });
};
export default LoadingState;
