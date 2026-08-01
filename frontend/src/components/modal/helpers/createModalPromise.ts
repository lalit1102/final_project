import { Modal } from "antd";

export function createModalPromise(options: Parameters<typeof Modal.confirm>[0]) {
  return new Promise<void>((resolve, reject) => {
    Modal.confirm({
      ...options,
      onOk: () => {
        Promise.resolve(options.onOk?.()).finally(() => resolve());
      },
      onCancel: () => {
        Promise.resolve(options.onCancel?.()).finally(() => reject(new Error("Modal cancelled")));
      },
    });
  });
}
