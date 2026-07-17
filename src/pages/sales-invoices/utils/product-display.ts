import { Product } from '@/models/product.model';

export const LOTTERY_PROMOTION_SYMBOL = '🏆';

type ProductNameSource = Pick<Product, 'name' | 'trade_name' | 'active_promotions'>;

export const hasLotteryPromotion = (product?: ProductNameSource | null): boolean => {
  return Array.isArray(product?.active_promotions) && product!.active_promotions.length > 0;
};

export const getProductBaseName = (product?: Pick<Product, 'name' | 'trade_name'> | null): string => {
  if (!product) return '';

  const tradeName = product.trade_name?.trim() || '';
  const name = product.name?.trim() || '';

  return tradeName || name || '';
};

export const getProductDisplayName = (product?: ProductNameSource | null): string => {
  const baseName = getProductBaseName(product);
  if (!baseName) return '';

  return hasLotteryPromotion(product) ? `${baseName} ${LOTTERY_PROMOTION_SYMBOL}` : baseName;
};
