import { jsx as _jsx } from "react/jsx-runtime";
import styles from './PageContainer.module.css';
const PageContainer = ({ children, className }) => {
    return (_jsx("div", { className: `${styles.pageContainer} ${className ?? ''}`, children: children }));
};
export default PageContainer;
