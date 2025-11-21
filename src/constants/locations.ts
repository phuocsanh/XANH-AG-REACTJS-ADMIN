/**
 * Danh sách các tỉnh/thành phố Việt Nam với tọa độ
 */

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
}

export const VIETNAM_LOCATIONS: Location[] = [
  // Miền Bắc
  { id: 'hanoi', name: 'Hà Nội', latitude: 21.0285, longitude: 105.8542, region: 'Miền Bắc' },
  { id: 'haiphong', name: 'Hải Phòng', latitude: 20.8449, longitude: 106.6881, region: 'Miền Bắc' },
  { id: 'quangninh', name: 'Quảng Ninh', latitude: 21.0064, longitude: 107.2925, region: 'Miền Bắc' },
  { id: 'bacninh', name: 'Bắc Ninh', latitude: 21.1861, longitude: 106.0763, region: 'Miền Bắc' },
  { id: 'hanam', name: 'Hà Nam', latitude: 20.5835, longitude: 105.9230, region: 'Miền Bắc' },
  { id: 'namdinh', name: 'Nam Định', latitude: 20.4388, longitude: 106.1621, region: 'Miền Bắc' },
  { id: 'thaibinh', name: 'Thái Bình', latitude: 20.4464, longitude: 106.3365, region: 'Miền Bắc' },
  { id: 'ninhbinh', name: 'Ninh Bình', latitude: 20.2506, longitude: 105.9745, region: 'Miền Bắc' },
  { id: 'thanhhoa', name: 'Thanh Hóa', latitude: 19.8067, longitude: 105.7851, region: 'Miền Bắc' },
  { id: 'nghean', name: 'Nghệ An', latitude: 18.6792, longitude: 105.6819, region: 'Miền Bắc' },
  { id: 'hatinh', name: 'Hà Tĩnh', latitude: 18.3559, longitude: 105.8877, region: 'Miền Bắc' },
  
  // Miền Trung
  { id: 'quangbinh', name: 'Quảng Bình', latitude: 17.4676, longitude: 106.6220, region: 'Miền Trung' },
  { id: 'quangtri', name: 'Quảng Trị', latitude: 16.7943, longitude: 107.1854, region: 'Miền Trung' },
  { id: 'hue', name: 'Thừa Thiên Huế', latitude: 16.4637, longitude: 107.5909, region: 'Miền Trung' },
  { id: 'danang', name: 'Đà Nẵng', latitude: 16.0544, longitude: 108.2022, region: 'Miền Trung' },
  { id: 'quangnam', name: 'Quảng Nam', latitude: 15.5394, longitude: 108.0191, region: 'Miền Trung' },
  { id: 'quangngai', name: 'Quảng Ngãi', latitude: 15.1214, longitude: 108.8044, region: 'Miền Trung' },
  { id: 'binhdinh', name: 'Bình Định', latitude: 13.7830, longitude: 109.2196, region: 'Miền Trung' },
  { id: 'phuyen', name: 'Phú Yên', latitude: 13.0882, longitude: 109.0929, region: 'Miền Trung' },
  { id: 'khanhhoa', name: 'Khánh Hòa', latitude: 12.2388, longitude: 109.1967, region: 'Miền Trung' },
  { id: 'ninhthuan', name: 'Ninh Thuận', latitude: 11.6739, longitude: 108.8629, region: 'Miền Trung' },
  { id: 'binhthuan', name: 'Bình Thuận', latitude: 10.9273, longitude: 108.1017, region: 'Miền Trung' },
  { id: 'daklak', name: 'Đắk Lắk', latitude: 12.6667, longitude: 108.0500, region: 'Tây Nguyên' },
  { id: 'gialai', name: 'Gia Lai', latitude: 13.9833, longitude: 108.0000, region: 'Tây Nguyên' },
  { id: 'kontum', name: 'Kon Tum', latitude: 14.3497, longitude: 108.0004, region: 'Tây Nguyên' },
  { id: 'lamdong', name: 'Lâm Đồng', latitude: 11.9404, longitude: 108.4583, region: 'Tây Nguyên' },
  
  // Miền Nam
  { id: 'binhphuoc', name: 'Bình Phước', latitude: 11.7511, longitude: 106.7234, region: 'Miền Nam' },
  { id: 'binhduong', name: 'Bình Dương', latitude: 11.3254, longitude: 106.4770, region: 'Miền Nam' },
  { id: 'dongnai', name: 'Đồng Nai', latitude: 10.9524, longitude: 106.8365, region: 'Miền Nam' },
  { id: 'tayninh', name: 'Tây Ninh', latitude: 11.3351, longitude: 106.0980, region: 'Miền Nam' },
  { id: 'baria', name: 'Bà Rịa - Vũng Tàu', latitude: 10.5417, longitude: 107.2429, region: 'Miền Nam' },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', latitude: 10.8231, longitude: 106.6297, region: 'Miền Nam' },
  { id: 'longan', name: 'Long An', latitude: 10.6956, longitude: 106.2431, region: 'Miền Nam' },
  { id: 'tiengiang', name: 'Tiền Giang', latitude: 10.4493, longitude: 106.3420, region: 'Miền Nam' },
  { id: 'bentre', name: 'Bến Tre', latitude: 10.2433, longitude: 106.3758, region: 'Miền Nam' },
  { id: 'travinh', name: 'Trà Vinh', latitude: 9.8127, longitude: 106.2992, region: 'Miền Nam' },
  { id: 'vinhlong', name: 'Vĩnh Long', latitude: 10.2397, longitude: 105.9571, region: 'Miền Nam' },
  { id: 'dongthap', name: 'Đồng Tháp', latitude: 10.4938, longitude: 105.6881, region: 'Miền Nam' },
  { id: 'angiang', name: 'An Giang', latitude: 10.5216, longitude: 105.1258, region: 'Miền Nam' },
  { id: 'kiengiang', name: 'Kiên Giang', latitude: 10.0125, longitude: 105.0808, region: 'Miền Nam' },
  { id: 'cantho', name: 'Cần Thơ', latitude: 10.0452, longitude: 105.7469, region: 'Miền Nam' },
  { id: 'haugiang', name: 'Hậu Giang', latitude: 9.7577, longitude: 105.6412, region: 'Miền Nam' },
  { id: 'soctrang', name: 'Sóc Trăng', latitude: 9.6037, longitude: 105.9739, region: 'Miền Nam' },
  { id: 'baclieu', name: 'Bạc Liêu', latitude: 9.2515, longitude: 105.7244, region: 'Miền Nam' },
  { id: 'camau', name: 'Cà Mau', latitude: 9.1526, longitude: 105.1960, region: 'Miền Nam' },
];

export const DEFAULT_LOCATION = VIETNAM_LOCATIONS[0]; // Hà Nội
