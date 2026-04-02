import { useEffect, useRef } from 'react';

/**
 * Hook để thêm pull-to-refresh cho PWA
 * Kéo xuống từ đầu trang sẽ reload trang
 */
export function usePullToRefresh() {
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    console.log('🚀 Pull-to-refresh hook mounted!');
    
    const handleTouchStart = (e: TouchEvent) => {
      // Chỉ kích hoạt khi scroll ở đầu trang (cho phép sai số nhỏ hoặc âm trên iOS)
      if (window.scrollY <= 5 && e.touches[0]) {
        // Kiểm tra nếu đang chạm vào phần tử có scroll riêng (sidebar, menu, dialog, etc.)
        const target = e.target as HTMLElement;
        const isInsideScrollable = target.closest('.sidebar, .menu, .drawer, [role="dialog"], .ant-drawer, .ant-modal, .overflow-y-auto, .overflow-y-scroll');
        
        // Kiểm tra nếu đang chọn text hoặc trong input
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
        const hasSelection = window.getSelection()?.toString().length ?? 0 > 0;

        if (isInsideScrollable || isInput || hasSelection) {
          touchStartYRef.current = 0;
          return;
        }

        touchStartYRef.current = e.touches[0].clientY;
        touchStartXRef.current = e.touches[0].clientX;
        isPullingRef.current = false;
        console.log('🔵 Touch start at:', touchStartYRef.current);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current > 0 && e.touches[0]) {
        const touchEndY = e.touches[0].clientY;
        const touchEndX = e.touches[0].clientX;
        
        const pullDistanceY = touchEndY - touchStartYRef.current;
        const pullDistanceX = Math.abs(touchEndX - touchStartXRef.current);

        // Nếu kéo ngang nhiều hơn kéo dọc thì coi như là quẹt ngang (mở menu, switch tab...), hủy pull
        if (pullDistanceX > Math.abs(pullDistanceY) && !isPullingRef.current) {
          touchStartYRef.current = 0;
          return;
        }

        // Chỉ xử lý nếu đang kéo xuống và ở đầu trang
        if (window.scrollY <= 5 && pullDistanceY > 0) {
          console.log('📏 Pull distance:', pullDistanceY);

          // Ngưỡng kéo (tăng lên 80px để tránh refresh quá nhạy)
          if (pullDistanceY > 80) {
            isPullingRef.current = true;
            console.log('🟢 Pull detected! Distance:', pullDistanceY);
          }
        } else if (pullDistanceY < 0) {
          // Nếu kéo lên thì reset
          isPullingRef.current = false;
        }
      }
    };

    const handleTouchEnd = () => {
      console.log('👆 Touch end. isPulling:', isPullingRef.current);
      
      if (isPullingRef.current) {
        // Kiểm tra lại scrollY một lần nữa để chắc chắn đang ở top
        if (window.scrollY <= 10) {
          console.log('🔄 Reloading page...');
          
          // Hiển thị loading indicator
          const loadingDiv = document.createElement('div');
          loadingDiv.id = 'pull-to-refresh-loader';
          loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            color: white;
            font-size: 18px;
            font-weight: bold;
            backdrop-filter: blur(2px);
          `;
          loadingDiv.innerHTML = `
            <div style="text-align: center; background: #fff; color: #059669; padding: 20px 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
              <div style="font-size: 40px; margin-bottom: 10px; animation: spin 1s linear infinite;">🔄</div>
              <div>Đang tải lại...</div>
              <style>
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              </style>
            </div>
          `;
          document.body.appendChild(loadingDiv);
          
          // Reload trang sau 300ms
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      }
      
      // Reset
      isPullingRef.current = false;
      touchStartYRef.current = 0;
      touchStartXRef.current = 0;
    };

    // Kiểm tra xem có đang chạy PWA không
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('📱 PWA mode:', isPWA);
    console.log('✅ Touch listeners added');
    
    // Luôn thêm listener (để test được trong browser thường)
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      console.log('🔴 Pull-to-refresh hook unmounted');
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // Empty dependency array - chỉ chạy 1 lần

  return {};
}
