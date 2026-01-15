import { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { useLocation } from 'react-router-dom';

/**
 * Hook để cảnh báo người dùng khi có thay đổi chưa lưu mà muốn rời khỏi trang.
 * Hỗ trợ cả phím back trình duyệt, phím back trên iOS (swipe) và reload trang.
 * 
 * @param isDirty Trạng thái form đã bị thay đổi hay chưa
 * @param message Thông báo hiển thị (mặc định tiếng Việt)
 */
export const useFormGuard = (isDirty: boolean, message = "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát không?") => {
  const location = useLocation();
  const isDirtyRef = useRef(isDirty);
  const isConfirmedRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // 1. Xử lý Reload trang hoặc Đóng tab (Browser level)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !isConfirmedRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);

  // 2. Xử lý điều hướng trong App (Back button / Swipe back on iOS)
  // Lưu ý: React Router v6 BrowserRouter không hỗ trợ useBlocker trực tiếp.
  // Chúng ta sử dụng kỹ thuật PopState để bắt sự kiện lùi trang.
  useEffect(() => {
    // Khi trang load, push một state ảo để nếu user back thì nó pop cái này trước
    window.history.pushState({ guarded: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      // Nếu đã confirm thoát, không chặn nữa
      if (isConfirmedRef.current) {
        return;
      }
      
      if (isDirtyRef.current) {
        // Nếu dirty, chặn lại bằng cách đẩy lại state (vì URL đã thực sự thay đổi một phần ở mức browser)
        // Hiển thị modal xác nhận của Ant Design
        Modal.confirm({
          title: 'Xác nhận thoát',
          content: message,
          okText: 'Thoát',
          cancelText: 'Ở lại',
          onOk: () => {
            isConfirmedRef.current = true;
            window.history.back(); // Thực sự quay lại
          },
          onCancel: () => {
            // Đẩy lại state ảo để bảo vệ tiếp
            window.history.pushState({ guarded: true }, '');
          },
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [message]);

  return {
    confirmExit: (onConfirm: () => void) => {
      if (isDirtyRef.current) {
        Modal.confirm({
          title: 'Xác nhận thoát',
          content: message,
          okText: 'Thoát',
          cancelText: 'Ở lại',
          onOk: () => {
            isConfirmedRef.current = true;
            onConfirm();
          },
        });
      } else {
        onConfirm();
      }
    }
  };
};
