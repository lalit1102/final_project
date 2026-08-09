import { jsx as _jsx } from "react/jsx-runtime";
import styles from './layout.module.css';
const AuthLayout = ({ children }) => {
    return (_jsx("div", { className: styles.authLayout, children: _jsx("main", { className: styles.authMain, children: children }) }));
};
export default AuthLayout;
