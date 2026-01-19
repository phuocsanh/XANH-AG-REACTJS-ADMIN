import { useEffect, useRef } from 'react';
import { App } from 'antd';

/**
 * Hook để cảnh báo người dùng khi có thay đổi chưa lưu mà muốn rời khỏi trang.
 */
export const useFormGuard = (isDirty: boolean, message = "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát không?") => {
  const isDirtyRef = useRef(isDirty);
  const isConfirmedRef = useRef(false);
  const { modal } = App.useApp(); // Sử dụng instance từ App context

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // 1. Xử lý Reload trang hoặc Đóng tab (Browser level)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !isConfirmedRef.current) {
        e.preventDefault();
        // Trình duyệt sẽ hiển thị thông báo mặc định của nó dựa trên ngôn ngữ trình duyệt
        e.returnValue = message; 
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);

  // 2. Xử lý điều hướng trong App (Back button / Swipe back on iOS)
  useEffect(() => {
    if (window.history.state?.guarded !== true) {
      window.history.pushState({ guarded: true }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (isConfirmedRef.current) return;

      if (isDirtyRef.current) {
        modal.confirm({
          title: 'Xác nhận thoát',
          content: message,
          okText: 'Thoát',
          cancelText: 'Ở lại',
          zIndex: 2000,
          onOk: () => {
            isConfirmedRef.current = true;
            window.history.back();
          },
          onCancel: () => {
            window.history.pushState({ guarded: true }, '');
          },
        });
      } else {
        isConfirmedRef.current = true;
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [message, modal]);

  return {
    confirmExit: (onConfirm: () => void) => {
      if (isDirtyRef.current) {
        modal.confirm({
          title: 'Xác nhận thoát',
          content: message,
          okText: 'Thoát',
          cancelText: 'Ở lại',
          zIndex: 2000,
          onOk: () => {
            isConfirmedRef.current = true;
            onConfirm();
          },
        });
      } else {
        isConfirmedRef.current = true;
        onConfirm();
      }
    }
  };
};
