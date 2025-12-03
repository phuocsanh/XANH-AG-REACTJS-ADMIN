/**
 * Cấu hình theme cho Ant Design
 * Thay đổi màu primary từ xanh dương sang xanh lá để phù hợp với theme nông nghiệp
 */

import type { ThemeConfig } from 'antd';

const themeConfig: ThemeConfig = {
  token: {
    // Màu chính - xanh lá (green-600 từ Tailwind CSS)
    colorPrimary: '#16a34a',
    
    // Màu liên quan đến primary
    colorPrimaryHover: '#15803d', // green-700 - màu khi hover
    colorPrimaryActive: '#14532d', // green-900 - màu khi active/pressed
    
    // Border radius
    borderRadius: 6,
    
    // Font family
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      // Cấu hình riêng cho Button component
      primaryShadow: '0 2px 0 rgba(22, 163, 74, 0.1)',
    },
  },
};

export default themeConfig;
