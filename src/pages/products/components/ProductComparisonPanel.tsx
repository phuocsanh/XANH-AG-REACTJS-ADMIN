import React, { useState } from 'react';
import {
  Card,
  Button,
  Upload,
  Select,
  Input,
  Table,
  Badge,
  Alert,
  Spin,
  Typography,
  Tag,
  Divider,
  message,
} from 'antd';
import {
  UploadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  productComparisonService,
  ProductInfo,
  ComparisonResult,
  fileToBase64,
  validateImageFile,
} from '@/services/product-comparison.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProductComparisonPanelProps {
  currentProduct: ProductInfo;
  availableProducts?: ProductInfo[]; // Danh sách sản phẩm có sẵn từ DB
}

const ProductComparisonPanel: React.FC<ProductComparisonPanelProps> = ({
  currentProduct,
  availableProducts = [],
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]); // Đổi thành array
  const [manualInput, setManualInput] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<UploadFile[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  // Xóa useEffect đăng ký sự kiện paste toàn cục
  // Logic paste sẽ được xử lý qua onPaste event của thẻ div

  // Xử lý upload ảnh
  const handleUploadChange = async (info: any) => {
    const { file, fileList } = info;

    // Validate file
    if (file.originFileObj && !validateImageFile(file.originFileObj)) {
      message.error('File không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP và tối đa 5MB');
      return;
    }

    setUploadedImages(fileList);
  };

  /**
   * Xử lý sự kiện paste ảnh
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        // Validate file
        if (!validateImageFile(file)) {
          message.error('File không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP và tối đa 5MB');
          return;
        }

        // Tạo UploadFile object
        const uploadFile: UploadFile = {
          uid: `paste-${Date.now()}`,
          name: `pasted-image-${Date.now()}.png`,
          status: 'done',
          originFileObj: file as any,
        };

        // Thêm vào danh sách - sử dụng callback để đảm bảo state mới nhất
        setUploadedImages(prev => [...prev, uploadFile]);
        message.success('Đã thêm ảnh từ clipboard');

        break;
      }
    }
  };

  // Xử lý so sánh
  const handleCompare = async () => {
    // Kiểm tra xem có ít nhất 1 nguồn dữ liệu không
    if (selectedProductIds.length === 0 && uploadedImages.length === 0 && !manualInput.trim()) {
      message.warning('Vui lòng chọn sản phẩm, upload ảnh, hoặc nhập thông tin để so sánh');
      return;
    }

    try {
      setLoading(true);
      
      // Chuẩn bị danh sách sản phẩm để so sánh
      const compareProducts: ProductInfo[] = [];

      // 1. Thêm các sản phẩm từ dropdown (nếu có)
      if (selectedProductIds.length > 0) {
        selectedProductIds.forEach(id => {
          const selectedProduct = availableProducts.find((p) => p.id === id);
          if (selectedProduct) {
            compareProducts.push(selectedProduct);
          }
        });
      }

      // 2. Thêm sản phẩm từ text input (nếu có)
      if (manualInput.trim()) {
        compareProducts.push({
          name: 'Sản phẩm từ mô tả',
          description: manualInput,
        });
      }

      // 3. Convert uploaded images to base64
      const imageBase64Array: string[] = [];
      for (const file of uploadedImages) {
        if (file.originFileObj) {
          const base64 = await fileToBase64(file.originFileObj);
          imageBase64Array.push(base64);
        }
      }

      // Gọi API so sánh
      const result = await productComparisonService.compareProducts(
        currentProduct,
        compareProducts,
        imageBase64Array.length > 0 ? imageBase64Array : undefined,
      );

      setComparisonResult(result);
      message.success('Đã hoàn thành so sánh sản phẩm');
    } catch (error) {
      console.error('Error comparing products:', error);
      message.error('Không thể so sánh sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Render bảng so sánh
  const renderComparisonTable = () => {
    if (!comparisonResult) return null;

    // Detect mobile
    const isMobile = window.innerWidth < 768;

    const columns = [
      {
        title: 'Tiêu chí',
        dataIndex: 'criteria',
        key: 'criteria',
        width: isMobile ? 80 : 200,
        fixed: isMobile ? undefined : ('left' as const),
        render: (text: string) => <Text strong className={isMobile ? 'text-xs' : ''}>{text}</Text>,
      },
      ...comparisonResult.comparison[0]?.products.map((product, idx) => ({
        title: product.name,
        key: `product-${idx}`,
        width: isMobile ? 150 : 250,
        render: (record: any) => {
          const productData = record.products[idx];
          const score = productData.score;
          let color = 'default';
          if (score >= 8) color = 'success';
          else if (score >= 6) color = 'warning';
          else if (score < 6) color = 'error';

          return (
            <div>
              <div className="mb-2">
                <Badge status={color as any} text={productData.value} />
              </div>
              <div className="mb-1">
                <Tag color={color}>{score}/10</Tag>
              </div>
              {productData.note && (
                <Text type="secondary" className="text-xs">
                  {productData.note}
                </Text>
              )}
            </div>
          );
        },
      })) || [],
    ];

    return (
      <div className="mt-6">
        <Title level={4}>Kết quả so sánh</Title>
        
        <Alert
          message="Tóm tắt"
          description={comparisonResult.summary}
          type="info"
          showIcon
          className="mb-4"
        />

        <Table
          columns={columns}
          dataSource={comparisonResult.comparison}
          pagination={false}
          scroll={{ x: isMobile ? 400 : 'max-content' }}
          rowKey="criteria"
          bordered
          size={isMobile ? 'small' : 'middle'}
        />

        {comparisonResult.recommendations.length > 0 && (
          <div className="mt-4">
            <Title level={5}>Khuyến nghị</Title>
            <ul className="list-disc pl-5">
              {comparisonResult.recommendations.map((rec, idx) => (
                <li key={idx}>
                  <Text>{rec}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="product-comparison-panel">
      <Card title={<><SwapOutlined /> So sánh Sản phẩm với AI</>} className="mb-1 md:mb-4">
        <Paragraph type="secondary">
          Chọn sản phẩm từ database, nhập thông tin thủ công, hoặc upload ảnh để AI phân tích và so sánh.
        </Paragraph>

        {/* Phần 1: Chọn sản phẩm từ DB */}
        <div className="mb-1 md:mb-4">
          <Title level={5}>1. Chọn sản phẩm từ Database (có thể chọn nhiều)</Title>
          <Select
            mode="multiple"
            showSearch
            style={{ width: '100%' }}
            placeholder="Tìm và chọn nhiều sản phẩm..."
            optionFilterProp="children"
            value={selectedProductIds}
            onChange={(value) => setSelectedProductIds(value)}
            allowClear
            maxTagCount="responsive"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={availableProducts.map((p) => ({
              value: p.id,
              label: `${p.name} - ${p.active_ingredient || 'N/A'}`,
            }))}
          />
        </div>

        {/* Phần 2: Upload ảnh */}
        <div className="mb-1 md:mb-4">
          <Title level={5}>2. Upload ảnh sản phẩm</Title>
          <Alert
            message="Tip: Click vào vùng này rồi nhấn Ctrl+V để dán ảnh"
            type="info"
            showIcon
            className="mb-2"
            closable
          />
          <div 
            onPaste={handlePaste}
            tabIndex={0}
            className="outline-none focus:ring-2 focus:ring-blue-100 rounded-lg p-2 transition-all"
            style={{ border: '1px dashed #d9d9d9' }}
          >
            <Upload
              listType="picture-card"
              fileList={uploadedImages}
              onChange={handleUploadChange}
              beforeUpload={() => false} // Prevent auto upload
              accept="image/jpeg,image/jpg,image/png,image/webp"
            >
              {uploadedImages.length < 3 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </div>
        </div>

        {/* Phần 3: Nhập thông tin thủ công */}
        <div className="mb-1 md:mb-4">
          <Title level={5}>3. Nhập thông tin sản phẩm hoặc prompt</Title>
          <TextArea
            rows={3}
            placeholder="Nhập thông tin sản phẩm (tên, hoạt chất, công dụng...) hoặc prompt để AI tìm kiếm"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
        </div>

        <Divider />

        {/* Nút so sánh */}
        <Button
          type="primary"
          size="large"
          icon={<SwapOutlined />}
          onClick={handleCompare}
          loading={loading}
          disabled={selectedProductIds.length === 0 && uploadedImages.length === 0 && !manualInput.trim()}
          block
        >
          So sánh với AI
        </Button>
      </Card>

      {/* Kết quả so sánh */}
      {loading && (
        <Card>
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">
              <Text>Đang phân tích và so sánh sản phẩm...</Text>
            </div>
          </div>
        </Card>
      )}

      {!loading && comparisonResult && renderComparisonTable()}
    </div>
  );
};

export default ProductComparisonPanel;
