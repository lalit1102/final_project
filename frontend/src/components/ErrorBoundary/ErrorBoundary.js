'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ErrorState from '@/components/common/ErrorState';
import styles from './ErrorBoundary.module.css';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: styles.errorBoundary, children: _jsx(ErrorState, { title: "Something went wrong", description: "An unexpected error occurred. Please try again.", onRetry: this.handleRetry, retryLabel: "Reload" }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
