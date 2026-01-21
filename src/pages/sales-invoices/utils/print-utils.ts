import dayjs from 'dayjs';
import { Season } from '@/models/season';

export interface PrintData {
  paperSize: 'A4' | 'K80';
  printSections: {
    invoice: boolean;
    advisory: boolean;
    diseaseWarning: boolean;
  };
  customerInfo: {
    name?: string;
    phone?: string;
    address?: string;
    warning?: string;
    notes?: string;
  };
  items: any[];
  formatCurrency: (value: number) => string;
  finalAmount: number;
  partialPaymentAmount: number;
  remainingAmount: number;
  seasonStats?: {
    customerId?: number | string;
    seasonId?: number | string;
    stats?: any;
    seasonsData?: any;
  };
  delivery: {
    isEnabled: boolean;
    shouldPrint: boolean;
    data: any;
  };
  advisory: {
    sections: {
      mix: boolean;
      sort: boolean;
      spray: boolean;
    };
    mixResult: string;
    sortResult: string;
    sprayingRecommendations: any[];
  };
  disease: {
    location: any;
    selectedDiseases: string[];
    availableWarnings: Array<{
      id: string;
      name: string;
      data: any;
    }>;
  };
}

/**
 * Hàm tạo nội dung HTML để in ấn hóa đơn và các thông tin tư vấn
 */
export const generatePrintContent = (data: PrintData) => {
  const {
    paperSize,
    printSections,
    customerInfo,
    items,
    formatCurrency,
    finalAmount,
    partialPaymentAmount,
    remainingAmount,
    seasonStats,
    delivery,
    advisory,
    disease,
  } = data;

  // CSS cho A4 (210mm) - Layout đầy đủ
  const stylesA4 = `
    <style>
      @page { size: A4; margin: 15mm; }
      body { font-family: 'Times New Roman', serif; line-height: 1.5; color: #000; font-size: 14px; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px; text-transform: uppercase; }
      .row { display: flex; margin-bottom: 5px; }
      .label { font-weight: bold; width: 150px; }
      .value { flex: 1; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
      th { background-color: #f0f0f0; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .total-section { margin-top: 15px; text-align: right; }
      .warning-box { border: 1px solid #faad14; background-color: #fffbe6; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
      .warning-header { display: flex; align-items: center; margin-bottom: 10px; font-weight: bold; color: #d46b08; }
      .warning-content { white-space: pre-line; }
      .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; color: white; font-size: 12px; margin-right: 10px; }
      .risk-CAO { background-color: #f5222d; }
      .risk-TRUNG_BINH { background-color: #fa8c16; color: #000; }
      .risk-THAP { background-color: #52c41a; }
      .footer { margin-top: 40px; text-align: center; font-style: italic; font-size: 12px; }
      
      /* Disease Warning Specific Styles */
      .disease-warning-item { margin-bottom: 20px; padding: 10px; border-left: 4px solid #fa8c16; background: #fff; }
      .disease-title { font-weight: bold; font-size: 15px; color: #d46b08; margin-bottom: 5px; }
      .disease-content { font-size: 14px; line-height: 1.6; }
    </style>
  `;

  // CSS cho K80 (80mm) - Layout đơn giản, font nhỏ hơn
  const stylesK80 = `
    <style>
      @page { size: 80mm auto; margin: 2mm; }
      body { font-family: 'Arial', sans-serif; line-height: 1.3; color: #000; font-size: 11px; max-width: 76mm; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
      .header h2 { font-size: 14px; margin: 5px 0; }
      .section { margin-bottom: 10px; }
      .section-title { font-size: 12px; font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 5px; padding-bottom: 3px; }
      .row { margin-bottom: 3px; }
      .label { font-weight: bold; display: inline-block; }
      .value { display: inline; }
      table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 10px; }
      th, td { border: 1px solid #ccc; padding: 3px; text-align: left; }
      th { background-color: #f0f0f0; font-size: 10px; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .total-section { margin-top: 8px; text-align: right; font-size: 11px; }
      .warning-box { border: 1px solid #faad14; background-color: #fffbe6; padding: 5px; margin-bottom: 8px; }
      .warning-header { font-weight: bold; color: #d46b08; margin-bottom: 3px; font-size: 11px; }
      .warning-content { white-space: pre-line; font-size: 10px; }
      .footer { margin-top: 15px; text-align: center; font-style: italic; font-size: 9px; }
      .disease-warning-item { margin-bottom: 8px; padding: 5px; border-left: 2px solid #fa8c16; }
      .disease-title { font-weight: bold; font-size: 11px; color: #d46b08; margin-bottom: 3px; }
      .disease-content { font-size: 10px; line-height: 1.4; }
    </style>
  `;

  const styles = paperSize === 'K80' ? stylesK80 : stylesA4;

  let content = `
    <html>
      <head>
        <title>${printSections.invoice ? 'Phiếu Tư Vấn & Hóa Đơn' : 'Phiếu Giao Hàng'}</title>
        ${styles}
      </head>
      <body>
  `;

  // Header khác nhau tùy theo có in hóa đơn hay không
  if (printSections.invoice) {
    content += `
        <div class="header">
          <h2>PHIẾU TƯ VẤN & HÓA ĐƠN BÁN HÀNG</h2>
          <p>Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</p>
        </div>
    `;
  } else {
    // Nếu chỉ in phiếu giao hàng, hiển thị ngày tạo đơn giản
    content += `
        <div class="header">
          <p>Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</p>
        </div>
    `;
  }

  // 1. INVOICE SECTION
  if (printSections.invoice) {
    content += `
      <div class="section">
        <div class="section-title">I. THÔNG TIN KHÁCH HÀNG & ĐƠN HÀNG</div>
        <div class="row"><span class="label">Khách hàng:</span><span class="value">${customerInfo.name || 'Khách lẻ'}</span></div>
        <div class="row"><span class="label">Số điện thoại:</span><span class="value">${customerInfo.phone || '-'}</span></div>
        <div class="row"><span class="label">Địa chỉ:</span><span class="value">${customerInfo.address || '-'}</span></div>
        
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Sản phẩm</th>
              <th class="text-center">SL</th>
              <th class="text-right">Đơn giá</th>
              <th class="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.product_name}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.unit_price)}</td>
                <td class="text-right">${formatCurrency(item.quantity * item.unit_price - (item.discount_amount || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="row" style="justify-content: flex-end"><span class="label">Tổng tiền:</span><span class="value" style="flex: 0 auto">${formatCurrency(finalAmount)}</span></div>
          ${partialPaymentAmount > 0 ? `<div class="row" style="justify-content: flex-end"><span class="label">Đã trả:</span><span class="value" style="flex: 0 auto">${formatCurrency(partialPaymentAmount)}</span></div>` : ''}
          ${remainingAmount > 0 ? `<div class="row" style="justify-content: flex-end"><span class="label">Còn nợ:</span><span class="value" style="flex: 0 auto; font-weight: bold;">${formatCurrency(remainingAmount)}</span></div>` : ''}
        </div>
        
        ${seasonStats?.customerId && seasonStats?.seasonId && seasonStats?.stats ? `
          <div style="margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #1976d2;">
            <div style="font-weight: bold; color: #1976d2; margin-bottom: 8px;">
              📊 Thống kê mùa vụ: ${seasonStats.seasonsData?.data?.items?.find((s: Season) => s.id === seasonStats.seasonId)?.name || ''}
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Tổng tiền mua hàng:</span>
              <span style="font-weight: bold; color: #2e7d32;">${formatCurrency(seasonStats.stats.totalPurchase || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Tổng nợ:</span>
              <span style="font-weight: bold; color: #d32f2f;">${formatCurrency(seasonStats.stats.totalDebt || 0)}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Thêm Lưu ý quan trọng và Ghi chú nếu có
  if (printSections.invoice) {
    const warning = customerInfo.warning;
    const notes = customerInfo.notes;
    
    if (warning || notes) {
      content += `<div class="section">`;
      
      if (warning) {
        content += `
          <div style="margin-bottom: 15px;">
            <strong>Lưu ý quan trọng:</strong>
            <div style="margin-top: 5px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107;">${warning.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }
      
      if (notes) {
        content += `
          <div style="margin-bottom: 15px;">
            <strong>Ghi chú:</strong>
            <div style="margin-top: 5px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #6c757d;">${notes.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      }
      
      content += `</div>`;
    }
  }

  // 2. DELIVERY LOG SECTION (Hiển thị ngay dưới Hóa đơn)
  if (delivery.isEnabled && delivery.shouldPrint && delivery.data) {
    if (printSections.invoice) {
      content += `<div style="border-top: 2px dashed #ccc; margin: 20px 0; padding-top: 20px;"></div>`;
    }
    
    // Fix Invalid Date Logic & Format Time string
    let deliveryTimeStr = '';
    if (delivery.data.delivery_start_time) {
        if (dayjs.isDayjs(delivery.data.delivery_start_time)) {
            deliveryTimeStr = delivery.data.delivery_start_time.format('HH:mm');
        } else if (typeof delivery.data.delivery_start_time === 'string') {
            deliveryTimeStr = delivery.data.delivery_start_time.substring(0, 5);
        }
    }

    content += `
      <div style="text-align: center; margin-bottom: 20px; ${!printSections.invoice ? 'margin-top: 30px;' : ''}">
        <h3 style="margin: 0; text-transform: uppercase;">Phiếu Giao Hàng</h3>
        <p style="margin: 5px 0; font-size: 13px;">Ngày giao: ${delivery.data.delivery_date ? dayjs(delivery.data.delivery_date).format('DD/MM/YYYY') : ''} ${deliveryTimeStr}</p>
      </div>
    `;

    if (!printSections.invoice) {
      // Hiển thị đầy đủ nếu KHÔNG in kèm hóa đơn
      content += `
        <div class="section">
           <div class="row"><span class="label">Người nhận:</span><span class="value">${delivery.data.receiver_name || ''}</span></div>
           <div class="row"><span class="label">Số điện thoại:</span><span class="value">${delivery.data.receiver_phone || ''}</span></div>
           <div class="row"><span class="label">Địa chỉ giao:</span><span class="value">${delivery.data.delivery_address || ''}</span></div>
           <div class="row"><span class="label">Ghi chú:</span><span class="value">${delivery.data.delivery_notes || 'Không có'}</span></div>
        </div>
      `;
    } else {
      // Nếu ĐÃ in hóa đơn, chỉ hiện Ghi chú (nếu có), bỏ hết địa chỉ
      if (delivery.data.delivery_notes) {
          content += `
            <div class="section">
               <div class="row"><span class="label">Ghi chú:</span><span class="value">${delivery.data.delivery_notes}</span></div>
            </div>
          `;
      }
    }

    content += `
      <div class="section">
        <div class="section-title">DANH SÁCH HÀNG HÓA CẦN GIAO</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">STT</th>
              <th>Tên hàng hóa</th>
              <th style="width: 80px; text-align: center;">ĐVT</th>
              <th style="width: 80px; text-align: right;">SL</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (delivery.data.items && delivery.data.items.length > 0) {
      delivery.data.items.forEach((item: any, index: number) => {
        const originalItem = (item.sales_invoice_item_id !== undefined) ? items[item.sales_invoice_item_id] : null;
        const productName = originalItem ? (originalItem.product_name || `Sản phẩm #${(item.sales_invoice_item_id || 0) + 1}`) : 'Unknown';
        const unit = (originalItem as any)?.unit || '';

        content += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${productName}</td>
            <td style="text-align: center;">${unit}</td>
            <td style="text-align: right;">${item.quantity}</td>
          </tr>
        `;
      });
    } else {
      content += `<tr><td colspan="4" class="text-center">Chưa chọn sản phẩm</td></tr>`;
    }

    content += `
          </tbody>
        </table>
      </div>

      <div class="section">
         <div class="row"><span class="label">Tài xế:</span><span class="value">${delivery.data.driver_name || '...'}</span></div>
         <div class="row"><span class="label">Biển số xe:</span><span class="value">${delivery.data.vehicle_number || '...'}</span></div>
      </div>
    `;

    // Chỉ hiện phần ký tên nếu KHÔNG in hóa đơn
    if (!printSections.invoice) {
      content += `
      <div style="margin-top: 30px; display: flex; justify-content: space-between; text-align: center;">
           <div style="width: 30%">
              <strong>Người giao hàng</strong><br>
              <span style="font-size: 11px; font-style: italic;">(Ký, họ tên)</span>
           </div>
           <div style="width: 30%">
              <strong>Người nhận hàng</strong><br>
              <span style="font-size: 11px; font-style: italic;">(Ký, họ tên)</span>
           </div>
      </div>
      `;
    }
    
    content += `<br/>`;
  }

  // 2. TECHNICAL ADVISORY SECTION
  const showMix = advisory.sections.mix && advisory.mixResult;
  const showSort = advisory.sections.sort && advisory.sortResult;
  const showSpray = advisory.sections.spray && advisory.sprayingRecommendations.length > 0;

  if (showMix || showSort || showSpray) {
    content += `<div class="section"><div class="section-title">II. TƯ VẤN KỸ THUẬT</div>`;
    
    if (showMix) {
      content += `
        <div style="margin-bottom: 15px;">
          <strong>Phối trộn thuốc:</strong>
          <div style="margin-top: 5px;">${advisory.mixResult.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }

    if (showSort) {
      content += `
        <div style="margin-bottom: 15px;">
          <strong>Thứ tự pha thuốc:</strong>
          <div style="margin-top: 5px;">${advisory.sortResult.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    }

    if (showSpray) {
      content += `
        <div style="margin-bottom: 15px;">
          <strong>Thời điểm phun thuốc tốt nhất:</strong>
          <ul style="margin-top: 5px; padding-left: 20px;">
            ${advisory.sprayingRecommendations.map(rec => `
              <li>
                <strong>${rec.time}</strong> - Mưa: ${rec.rain_prob}, Gió: ${rec.wind_speed}, ${rec.condition}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
    
    content += `</div>`;
  }

  // 3. DISEASE WARNING SECTION
  if (printSections.diseaseWarning) {
    const activeWarnings = disease.availableWarnings.filter(w => disease.selectedDiseases.includes(w.id));

    if (activeWarnings.length > 0) {
      content += `<div class="section"><div class="section-title">III. CẢNH BÁO BỆNH/SÂU HẠI (Tại ${disease.location?.name || 'Vị trí đã chọn'})</div>`;
      
      activeWarnings.forEach(w => {
        let messageHtml = w.data?.message || '';
        
        // Loại bỏ phần "PHÂN TÍCH CHI TIẾT" và "KHUYẾN NGHỊ" khỏi message
        const detailIndex = messageHtml.indexOf('PHÂN TÍCH CHI TIẾT');
        const detailIndexWithEmoji = messageHtml.indexOf('🔍 PHÂN TÍCH CHI TIẾT');
        
        let cutIndex = -1;
        if (detailIndex !== -1 && detailIndexWithEmoji !== -1) {
          cutIndex = Math.min(detailIndex, detailIndexWithEmoji);
        } else if (detailIndex !== -1) {
          cutIndex = detailIndex;
        } else if (detailIndexWithEmoji !== -1) {
          cutIndex = detailIndexWithEmoji;
        }
        
        if (cutIndex !== -1) {
          messageHtml = messageHtml.substring(0, cutIndex).trim();
        }
        
        content += `
          <div class="disease-warning-item">
            <div class="disease-title">
              ${w.name}
            </div>
            <div class="disease-content">
              ${messageHtml.replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      });
      
      content += `</div>`;
    } else if (disease.location && disease.selectedDiseases.length === 0 && disease.availableWarnings.length === 0) {
       content += `
        <div class="section">
          <div class="section-title">III. CẢNH BÁO BỆNH/SÂU HẠI</div>
          <p>Hiện tại chưa phát hiện nguy cơ cao tại khu vực ${disease.location.name}.</p>
        </div>
      `;
    }
  }

  content += `
        <div class="footer">
          <p>Cảm ơn quý khách đã tin tưởng sử dụng sản phẩm & dịch vụ!</p>
          <p>Hệ thống Xanh AG - Đồng hành cùng nhà nông</p>
        </div>
      </body>
    </html>
  `;
  return content;
};
