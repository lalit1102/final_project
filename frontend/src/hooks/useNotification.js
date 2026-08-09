"use client";
import { message } from "antd";
function generateKey(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
/**
 * Build an AntD `ArgsProps` object from the positional `JointContent` API,
 * injecting a generated `key` so the caller can later destroy it.
 */
function buildConfig(content, options) {
    const { duration, onClose, type } = options;
    const key = generateKey(type);
    const isArgsProps = typeof content === "object" && content !== null && "content" in content;
    const base = isArgsProps
        ? { ...content, key }
        : { content, key };
    if (duration !== undefined) {
        if (typeof duration === "function") {
            base.onClose = duration;
        }
        else {
            base.duration = duration;
        }
    }
    if (onClose !== undefined) {
        base.onClose = onClose;
    }
    base.type = type;
    return base;
}
/**
 * A thin, type-safe wrapper around Ant Design's `message` API.
 *
 * Exposes `success`, `error`, `warning`, `info`, `loading`, and `destroy`,
 * each returning a `React.Key` from `success/error/warning/info/loading`
 * that can be passed to `destroy()` for manual dismissal (e.g. clearing a
 * loading indicator after an async operation completes).
 *
 * Design notes:
 * - Uses AntD's static `message` singleton — no extra provider required.
 * - AntD manages the entire notification lifecycle internally.
 * - No Redux state, no business logic, no API calls.
 *
 * @returns Object with notification methods.
 */
export function useNotification() {
    const call = (type, content, duration, onClose) => {
        const config = buildConfig(content, { duration, onClose, type });
        message.open(config);
        return config.key;
    };
    return {
        success: (content, duration, onClose) => call("success", content, duration, onClose),
        error: (content, duration, onClose) => call("error", content, duration, onClose),
        warning: (content, duration, onClose) => call("warning", content, duration, onClose),
        info: (content, duration, onClose) => call("info", content, duration, onClose),
        loading: (content, duration, onClose) => call("loading", content, duration, onClose),
        destroy: (key) => message.destroy(key),
    };
}
