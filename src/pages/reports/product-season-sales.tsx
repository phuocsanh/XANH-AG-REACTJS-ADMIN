import React, { useMemo, useState } from 'react';
import { Alert, Card, Col, Row, Select, Spin, Statistic, Typography } from 'antd';
import { ShoppingCartOutlined, RollbackOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores';
import { RoleCode } from '@/constant/role';
import { useSeasonsQuery } from '@/queries/season';
import { useProductSearch } from '@/queries/product';
import { useProductSeasonSales } from '@/queries/store-profit-report';

const { Title, Text } = Typography;

const ProductSeasonSalesPage: React.FC = () => {
  const userInfo = useAppStore((state) => state.userInfo);
  const isSuperAdmin = userInfo?.role?.code === RoleCode.SUPER_ADMIN;
  const [seasonId, setSeasonId] = useState<number>();
  const [productId, setProductId] = useState<number>();

  const { data: seasonsData, isLoading: seasonsLoading } = useSeasonsQuery({ page: 1, limit: 100 });
  const { data: productsData, isLoading: productsLoading } = useProductSearch('', 100, isSuperAdmin);
  const { data: report, isLoading: reportLoading, isError } = useProductSeasonSales(productId || 0, seasonId || 0);

  const seasons = seasonsData?.data?.items || [];
  const products = useMemo(
    () => productsData?.pages.flatMap((page) => page.data || []) || [],
    [productsData],
  );
  const unit = report?.unit_name || 'đơn vị';
  const formatQuantity = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')} ${unit}`;

  if (!isSuperAdmin) {
    return <Alert type="error" showIcon message="Không có quyền truy cập" description="Chỉ Super Admin được xem báo cáo này." />;
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Số lượng sản phẩm đã bán theo mùa vụ</Title>
      <Text type="secondary">Số liệu được tính từ hóa đơn đã xác nhận/thanh toán và đã trừ hàng trả lại.</Text>

      <Card style={{ marginTop: 20, marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Text strong>Mùa vụ</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Chọn mùa vụ"
              value={seasonId}
              loading={seasonsLoading}
              onChange={setSeasonId}
              options={seasons.map((season) => ({ label: `${season.name} (${season.year})`, value: season.id }))}
              allowClear
            />
          </Col>
          <Col xs={24} md={10}>
            <Text strong>Sản phẩm</Text>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Chọn sản phẩm"
              value={productId}
              loading={productsLoading}
              onChange={setProductId}
              options={products.map((product: any) => ({
                label: `${product.trade_name || product.name || `Sản phẩm #${product.id}`}${product.code ? ` (${product.code})` : ''}`,
                value: product.id,
              }))}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {!seasonId || !productId ? (
        <Alert type="info" showIcon message="Vui lòng chọn mùa vụ và sản phẩm" />
      ) : reportLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : isError ? (
        <Alert type="error" showIcon message="Không tải được báo cáo" description="Vui lòng thử lại hoặc kiểm tra quyền Super Admin." />
      ) : report ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}><Card><Statistic title="Thực bán" value={report.quantity_sold} precision={4} suffix={unit} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#389e0d' }} /></Card></Col>
            <Col xs={24} md={8}><Card><Statistic title="Đã trả lại" value={report.quantity_returned} precision={4} suffix={unit} prefix={<RollbackOutlined />} valueStyle={{ color: '#d48806' }} /></Card></Col>
            <Col xs={24} md={8}><Card><Statistic title="Số hóa đơn" value={report.invoice_count} prefix={<FileTextOutlined />} /></Card></Col>
          </Row>
          <Card style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}><Text type="secondary">Sản phẩm</Text><div><strong>{report.product_name}</strong></div></Col>
              <Col xs={24} md={8}><Text type="secondary">Mùa vụ</Text><div><strong>{report.season_name}</strong></div></Col>
              <Col xs={24} md={8}><Text type="secondary">Tổng trên hóa đơn</Text><div><strong>{formatQuantity(report.quantity_invoiced)}</strong></div></Col>
            </Row>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default ProductSeasonSalesPage;
