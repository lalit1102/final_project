import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Skeleton, Grid } from 'antd';
import styles from './SkeletonLoader.module.css';
const SkeletonLoader = ({ variant = 'default', count = 1, ...props }) => {
    const { md } = Grid.useBreakpoint();
    const isMobile = !md;
    const renderSkeleton = () => {
        switch (variant) {
            case 'card':
                return (_jsx(Skeleton, { loading: true, active: true, paragraph: { rows: 4 }, title: { width: '60%' }, styles: {
                        section: { minHeight: isMobile ? 140 : 180 },
                    }, ...props }));
            case 'list': {
                const listItems = Array.from({ length: count }).map((_, index) => (_jsx(Skeleton, { loading: true, active: true, paragraph: { rows: 2 }, title: { width: '80%' }, styles: {
                        section: { minHeight: 50 },
                    }, style: { marginBottom: 12 } }, `list-item-${index}`)));
                return _jsx(_Fragment, { children: listItems });
            }
            case 'profile':
                return (_jsx(Skeleton, { loading: true, active: true, paragraph: { rows: 3 }, title: { width: '40%' }, avatar: { size: isMobile ? 64 : 80, shape: 'circle' }, styles: {
                        section: { minHeight: isMobile ? 140 : 180 },
                    }, ...props }));
            case 'form':
                return (_jsx(Skeleton, { loading: true, active: true, paragraph: { rows: 5 }, title: { width: '30%' }, styles: {
                        section: { minHeight: isMobile ? 280 : 320 },
                    }, ...props }));
            default:
                return (_jsx(Skeleton, { loading: true, active: true, paragraph: { rows: count }, title: { width: '100%' }, ...props }));
        }
    };
    return _jsx("div", { className: styles.skeletonLoader, children: renderSkeleton() });
};
export default SkeletonLoader;
