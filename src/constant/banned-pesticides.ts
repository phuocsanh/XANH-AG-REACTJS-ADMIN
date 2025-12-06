/**
 * Danh sách hoạt chất thuốc bảo vệ thực vật bị cấm sử dụng tại Việt Nam
 * Theo quy định của Bộ Nông nghiệp và Phát triển Nông thôn
 */

// Thuốc trừ sâu và thuốc bảo quản lâm sản bị cấm (28 hoạt chất)
export const BANNED_INSECTICIDES = [
  'Aldrin',
  'BHC',
  'Lindane',
  'Cadmium',
  'Compound (Cd)',
  'Carbofuran',
  'Chlordane',
  'Chlordimeform',
  'DDT',
  'Dieldrin',
  'Endosulfan',
  'Endrin',
  'Heptachlor',
  'Isobenzan',
  'Isodrin',
  'Lead (Pb)',
  'Methamidophos',
  'Methyl Parathion',
  'Monocrotophos',
  'Parathion Ethyl',
  'Sodium Pentachlorophenate monohydrate',
  'Pentachlorophenol',
  'Phosphamidon',
  'Polychlorocamphene',
  'Trichlorfon (Chlorophos)',
  'Chlorpyrifos Ethyl',
  'Fipronil',
  // 'Carbosulfan' - Đã chuyển sang danh sách hạn chế/cảnh báo
];

// Thuốc trừ bệnh bị cấm (06 hoạt chất)
export const BANNED_FUNGICIDES = [
  'Arsenic (As)',
  'Captain',
  'Captafol',
  'Hexachlorobenzene',
  'Mercury (Hg)',
  'Selenium (Se)',
];

// Thuốc trừ chuột bị cấm (01 hoạt chất)
export const BANNED_RODENTICIDES = [
  'Talium compond',
];

// Thuốc trừ cỏ bị cấm (01 hoạt chất)
export const BANNED_HERBICIDES = [
  '2,4,5 - T',
  'Glyphosate',
];

// Danh sách hoạt chất hạn chế sử dụng / Cảnh báo đặc biệt (Chưa cấm hoàn toàn nhưng cần lưu ý)
export const RESTRICTED_INGREDIENTS = [
  'Carbosulfan',
];

// Tổng hợp tất cả hoạt chất bị cấm
export const ALL_BANNED_INGREDIENTS = [
  ...BANNED_INSECTICIDES,
  ...BANNED_FUNGICIDES,
  ...BANNED_RODENTICIDES,
  ...BANNED_HERBICIDES,
];

// Tổng hợp tất cả hoạt chất hạn chế/cảnh báo
export const ALL_RESTRICTED_INGREDIENTS = [
  ...RESTRICTED_INGREDIENTS
];

// Phân loại hoạt chất bị cấm
export const BANNED_INGREDIENTS_BY_TYPE = {
  insecticides: {
    name: 'Thuốc trừ sâu và thuốc bảo quản lâm sản',
    count: BANNED_INSECTICIDES.length,
    ingredients: BANNED_INSECTICIDES,
  },
  fungicides: {
    name: 'Thuốc trừ bệnh',
    count: BANNED_FUNGICIDES.length,
    ingredients: BANNED_FUNGICIDES,
  },
  rodenticides: {
    name: 'Thuốc trừ chuột',
    count: BANNED_RODENTICIDES.length,
    ingredients: BANNED_RODENTICIDES,
  },
  herbicides: {
    name: 'Thuốc trừ cỏ',
    count: BANNED_HERBICIDES.length,
    ingredients: BANNED_HERBICIDES,
  },
};

// Hàm kiểm tra hoạt chất có bị cấm không
export const isBannedIngredient = (ingredient: string): boolean => {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  return ALL_BANNED_INGREDIENTS.some(
    (banned) => normalizedIngredient.includes(banned.toLowerCase())
  );
};

// Hàm kiểm tra hoạt chất có bị hạn chế/cảnh báo không
export const isRestrictedIngredient = (ingredient: string): boolean => {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  return ALL_RESTRICTED_INGREDIENTS.some(
    (restricted) => normalizedIngredient.includes(restricted.toLowerCase())
  );
};

// Hàm tìm loại thuốc bị cấm
export const getBannedType = (ingredient: string): string | null => {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  
  if (BANNED_INSECTICIDES.some(banned => normalizedIngredient.includes(banned.toLowerCase()))) {
    return 'insecticides';
  }
  if (BANNED_FUNGICIDES.some(banned => normalizedIngredient.includes(banned.toLowerCase()))) {
    return 'fungicides';
  }
  if (BANNED_RODENTICIDES.some(banned => normalizedIngredient.includes(banned.toLowerCase()))) {
    return 'rodenticides';
  }
  if (BANNED_HERBICIDES.some(banned => normalizedIngredient.includes(banned.toLowerCase()))) {
    return 'herbicides';
  }
  
  return null;
};
