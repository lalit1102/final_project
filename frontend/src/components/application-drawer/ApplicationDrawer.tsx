"use client";

import { useState, useCallback } from "react";
import { Drawer, Button, Spin, Empty } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import type { ApplicationDrawerProps, ApplicationItem } from "./types";
import LogoFull from "@/components/logo/LogoFull";
import styles from "./ApplicationDrawer.module.css";

export default function ApplicationDrawer({
  applications = [],
  loading = false,
  open,
  defaultOpen = false,
  title = "Select application",
  triggerLabel,
  triggerIcon,
  logo,
  onOpen,
  onClose,
  onApplicationSelect,
  footerLinks,
  emptyText = "No applications available",
}: ApplicationDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpen = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(true);
    }
    onOpen?.();
  }, [isControlled, onOpen]);

  const handleClose = useCallback(() => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onClose?.();
  }, [isControlled, onClose]);

  const handleApplicationSelect = useCallback(
    (app: ApplicationItem) => {
      onApplicationSelect?.(app);
    },
    [onApplicationSelect]
  );

  const renderFooter = () => {
    if (!footerLinks) return null;

    const links: { label: string; href: string; target?: string; rel?: string }[] = [];

    if (footerLinks.helpCenter) {
      links.push({ ...footerLinks.helpCenter, target: "_blank", rel: "noopener noreferrer" });
    }
    if (footerLinks.privacyPolicy) {
      links.push({ ...footerLinks.privacyPolicy, target: "_blank", rel: "noopener noreferrer" });
    }
    if (footerLinks.cookiesPolicy) {
      links.push({ ...footerLinks.cookiesPolicy, target: "_blank", rel: "noopener noreferrer" });
    }

    if (links.length === 0) return null;

    return (
      <div className={styles.footer}>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.target}
            rel={link.rel}
            className={styles.footerLink}
          >
            {link.label}
          </a>
        ))}
      </div>
    );
  };

  return (
    <>
      <Button
        icon={triggerIcon}
        onClick={handleOpen}
        type="text"
        aria-label={triggerLabel}
      >
        {triggerLabel}
      </Button>

      <Drawer
        placement="left"
        open={isOpen}
        onClose={handleClose}
        width={400}
        closable={false}
        title={null}
        footer={null}
        styles={{
          body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" },
        }}
        destroyOnClose
      >
        <div className={styles.container}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
            <div className={styles.logo}>
              {logo ?? <LogoFull />}
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.title}>{title}</div>

            {loading && (
              <div className={styles.loading}>
                <Spin size="large" />
              </div>
            )}

            {!loading && applications.length === 0 && (
              <div className={styles.empty}>
                <Empty description={emptyText} />
              </div>
            )}

            {!loading && applications.length > 0 && (
              <div className={styles.appList}>
                {applications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={styles.appButton}
                    onClick={() => handleApplicationSelect(app)}
                    disabled={app.disabled}
                  >
                    {app.icon && <span className={styles.appIcon}>{app.icon}</span>}
                    <span className={styles.appName}>{app.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {renderFooter()}
        </div>
      </Drawer>
    </>
  );
}
