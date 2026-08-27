import React, { useState, useCallback } from 'react';
import { Modal } from 'antd';
import type { ConfirmDialogProps } from './ConfirmDialog.types';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  okText = 'Confirm',
  cancelText = 'Cancel',
  okButtonDanger = true,
  confirmLoading: externalLoading,
   destroyOnHidden = true,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = useCallback(async () => {
    setInternalLoading(true);
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setInternalLoading(false);
    }
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      open={open}
      title={title}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{
        loading: isLoading,
        danger: okButtonDanger,
        disabled: isLoading,
      }}
      cancelButtonProps={{ disabled: isLoading }}
      centered
       destroyOnHidden={destroyOnHidden}
      styles={{
        body: { paddingBottom: 0 },
      }}
    >
      {content !== undefined && (
        <div className={styles.dialogBody}>{content}</div>
      )}
    </Modal>
  );
};

export default ConfirmDialog;
