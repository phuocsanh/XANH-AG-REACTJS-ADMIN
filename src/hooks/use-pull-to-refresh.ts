import { useEffect, useRef } from 'react';

/**
 * Hook để thêm pull-to-refresh cho PWA
 * Kéo xuống từ đầu trang sẽ reload trang
 */
export function usePullToRefresh() {
  const touchStartYRef = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    console.log('🚀 Pull-to-refresh hook mounted!');
    
    const handleTouchStart = (e: TouchEvent) => {
      // Chỉ kích hoạt khi scroll ở đầu trang
      if (window.scrollY === 0) {
        touchStartYRef.current = e.touches[0].clientY;
        console.log('🔵 Touch start at:', touchStartYRef.current);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStartYRef.current > 0) {
        const touchEndY = e.touches[0].clientY;
        const pullDistance = touchEndY - touchStartYRef.current;

        console.log('📏 Pull distance:', pullDistance);

        // Nếu kéo xuống > 60px (tăng từ 35px để tránh refresh quá dễ)
        if (pullDistance > 60) {
          isPullingRef.current = true;
          console.log('🟢 Pull detected! Distance:', pullDistance);
        }
      }
    };

    const handleTouchEnd = () => {
      console.log('👆 Touch end. isPulling:', isPullingRef.current);
      
      if (isPullingRef.current) {
        console.log('🔄 Reloading page...');
        
        // Hiển thị loading indicator
        const loadingDiv = document.createElement('div');
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
          z-index: 9999;
          color: white;
          font-size: 18px;
          font-weight: bold;
        `;
        loadingDiv.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">🔄</div>
            <div>Đang tải lại...</div>
          </div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Reload trang sau 300ms để user thấy loading
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
      
      // Reset
      isPullingRef.current = false;
      touchStartYRef.current = 0;
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
