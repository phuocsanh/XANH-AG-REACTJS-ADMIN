import { useEffect } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';
import api from '@/utils/api';
import { toast } from 'react-toastify';

/**
 * Hook quản lý Firebase notifications
 * - Request notification permission
 * - Lấy FCM token và cập nhật vào user profile
 * - Listen foreground messages và hiển thị toast
 * @param isLogin - Trạng thái đăng nhập của user
 */
export function useFirebaseNotifications(isLogin?: boolean) {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Chỉ setup khi user đã đăng nhập
        if (!isLogin) {
          console.log('ℹ️ Chưa đăng nhập, bỏ qua việc setup FCM token');
          return;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Lấy FCM token từ Firebase
          const token = await requestForToken();
          
          if (token) {
            console.log('FCM Token:', token);
            
            try {
              // Gửi token lên server để cập nhật vào user profile
              await api.putRaw('/users/fcm-token', { fcm_token: token });
              console.log('✅ FCM token đã được đồng bộ với server');
            } catch (error) {
              console.error('❌ Lỗi khi gửi FCM token lên server:', error);
            }
          } else {
            console.log('⚠️ Không lấy được FCM token từ Firebase');
          }
        } else {
          console.log('⚠️ Notification permission bị từ chối');
        }
      } catch (error) {
        console.error('Notification setup error:', error);
      }
    };

    // Setup notifications khi component mount hoặc khi isLogin thay đổi
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setupNotifications();
      
      // Listen foreground messages (chỉ setup 1 lần)
      if (isLogin) {
        onMessageListener()
          .then((payload: any) => {
            console.log('Foreground message:', payload);
            
            // Hiển thị toast notification
            if (payload.notification) {
              const title = payload.notification.title || 'Thông báo';
              const body = payload.notification.body || '';
              
              toast.info(`${title}\n${body}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            }
          })
          .catch((err: any) => console.log('Failed to receive foreground message:', err));
      }
    }
  }, [isLogin]); // Chạy lại khi isLogin thay đổi
}
