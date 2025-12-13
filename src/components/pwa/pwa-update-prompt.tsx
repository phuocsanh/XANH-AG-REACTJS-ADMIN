import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { notification } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

// Component hiển thị thông báo khi có phiên bản PWA mới
export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      notification.info({
        message: 'Có phiên bản mới!',
        description: 'Một phiên bản mới của ứng dụng đã sẵn sàng. Nhấn "Cập nhật" để sử dụng phiên bản mới nhất.',
        duration: 0, // Không tự động đóng
        placement: 'bottomRight',
        btn: (
          <div className="flex gap-2">
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Để sau
            </button>
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
            >
              <ReloadOutlined />
              Cập nhật ngay
            </button>
          </div>
        ),
        key: 'pwa-update',
      })
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
