import { useEffect, useState } from 'react';

/**
 * Hook để thêm pull-to-refresh cho PWA
 * Kéo xuống từ đầu trang sẽ reload trang
 */
export function usePullToRefresh() {
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Chỉ kích hoạt khi scroll ở đầu trang
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        setStartY(touchStartY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && touchStartY > 0) {
        touchEndY = e.touches[0].clientY;
        const pullDistance = touchEndY - touchStartY;

        // Nếu kéo xuống > 80px
        if (pullDistance > 80) {
          setIsPulling(true);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling) {
        // Reload trang
        window.location.reload();
      }
      
      // Reset
      setIsPulling(false);
      setStartY(0);
      touchStartY = 0;
      touchEndY = 0;
    };

    // Chỉ thêm listener khi đang chạy PWA (standalone mode)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isPWA) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (isPWA) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isPulling, startY]);

  return { isPulling };
}
