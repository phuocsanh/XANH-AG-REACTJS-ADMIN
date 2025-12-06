import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Typography,
  Alert,
  Spin,
  Tag,
  List,
  Collapse,
  Space,
  message,
  Image,
} from 'antd';
import {
  UploadOutlined,
  CameraOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { frontendAiService } from '@/services/ai.service';
import {
  ALL_BANNED_INGREDIENTS,
  BANNED_INGREDIENTS_BY_TYPE,
  ALL_RESTRICTED_INGREDIENTS,
  RESTRICTED_INGREDIENTS,
} from '@/constant/banned-pesticides';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Interface cho kết quả phân tích từ AI
 */
interface AnalysisResult {
  product_name?: string;
  detected_ingredients: string[];
  banned_ingredients: string[];
  restricted_ingredients?: string[]; // Thêm trường danh sách hạn chế
  is_banned: boolean;
  is_restricted?: boolean; // Thêm trường check hạn chế
  warning_level: 'NGUY_HIỂM' | 'CẢNH_BÁO' | 'AN_TOÀN' | 'KHÔNG_XÁC_ĐỊNH';
  warning_message: string;
  recommendations?: string;
}

/**
 * Trang phân tích thuốc bảo vệ thực vật bị cấm
 */
const BannedPesticidesPage: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  // Xử lý paste ảnh từ clipboard
  React.useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          // Tạo UploadFile object
          const uploadFile: UploadFile = {
            uid: `paste-${Date.now()}`,
            name: `pasted-image-${Date.now()}.png`,
            status: 'done',
            originFileObj: file as any,
          };

          // Cập nhật state (thay thế ảnh cũ)
          setFileList([uploadFile]);
          setError('');
          setAnalysisResult(null);

          // Tạo preview
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            setImagePreview(reader.result as string);
          };

          message.success('Đã dán ảnh từ clipboard');
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  /**
   * Chuyển đổi file thành base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Loại bỏ prefix "data:image/...;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Xử lý khi chọn file
   */
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    setError('');
    setAnalysisResult(null);

    // Tạo preview cho ảnh
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const reader = new FileReader();
      reader.readAsDataURL(newFileList[0].originFileObj);
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
    } else {
      setImagePreview('');
    }
  };

  /**
   * Xử lý phân tích ảnh
   */
  const handleAnalyze = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.warning('Vui lòng chọn ảnh để phân tích');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    try {
      // Chuyển đổi file thành base64
      const base64Image = await fileToBase64(fileList[0].originFileObj);

      // Gọi AI để phân tích với cả danh sách cấm và danh sách hạn chế
      const response = await frontendAiService.analyzePesticideImage(
        base64Image,
        ALL_BANNED_INGREDIENTS,
        ALL_RESTRICTED_INGREDIENTS // Truyền thêm danh sách hạn chế
      );

      if (response.success && response.answer) {
        try {
          // Parse JSON từ response
          const cleanJson = response.answer
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          const result: AnalysisResult = JSON.parse(cleanJson);
          setAnalysisResult(result);
          
          // Hiển thị thông báo
          if (result.is_banned) {
            message.error('⚠️ Phát hiện hoạt chất bị cấm!');
          } else if (result.is_restricted) {
            message.warning('⚠️ Phát hiện hoạt chất hạn chế sử dụng!');
          } else if (result.warning_level === 'AN_TOÀN') {
            message.success('✅ Sản phẩm an toàn');
          } else {
            message.info('ℹ️ Không xác định được hoạt chất');
          }
        } catch (parseError) {
          console.error('Lỗi parse JSON:', parseError);
          setError('Không thể phân tích kết quả từ AI. Vui lòng thử lại.');
        }
      } else {
        setError(response.error || 'Có lỗi xảy ra khi phân tích ảnh');
      }
    } catch (err) {
      console.error('Lỗi phân tích:', err);
      setError((err as Error).message || 'Có lỗi không xác định xảy ra');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Lấy icon và màu sắc theo mức độ cảnh báo
   */
  const getWarningDisplay = (level: string) => {
    switch (level) {
      case 'NGUY_HIỂM':
        return {
          icon: <WarningOutlined />,
          color: 'red',
          text: 'NGUY HIỂM',
        };
      case 'CẢNH_BÁO':
        return {
          icon: <WarningOutlined />,
          color: 'gold', // Màu vàng cam cho cảnh báo
          text: 'CẢNH BÁO / HẠN CHẾ',
        };
      case 'AN_TOÀN':
        return {
          icon: <CheckCircleOutlined />,
          color: 'green',
          text: 'AN TOÀN',
        };
      default:
        return {
          icon: <QuestionCircleOutlined />,
          color: 'orange',
          text: 'KHÔNG XÁC ĐỊNH',
        };
    }
  };

  return (
    <div className="w-full p-4">
      <Title level={2} className="!text-xl md:!text-3xl !mb-4">
        🔍 Kiểm Tra Thuốc Bảo Vệ Thực Vật Bị Cấm
      </Title>

      {/* Hướng dẫn sử dụng */}
      <Alert
        message="Hướng dẫn sử dụng"
        description={
          <div>
            <p>1. Chụp, tải lên hoặc <b>dán (Ctrl+V)</b> ảnh nhãn thuốc bảo vệ thực vật</p>
            <p>2. Nhấn nút "Phân tích" để AI kiểm tra hoạt chất</p>
            <p>3. Xem kết quả và cảnh báo (nếu có)</p>
            <p className="text-red-600 font-semibold mt-2">
              ⚠️ Lưu ý: Tuyệt đối KHÔNG sử dụng thuốc có chứa hoạt chất bị cấm!
            </p>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phần upload và phân tích */}
        <Card title="📸 Tải lên ảnh thuốc" className="h-fit">
          <Space direction="vertical" className="w-full" size="large">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleChange}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {fileList.length === 0 && (
                <div>
                  <CameraOutlined className="text-2xl" />
                  <div className="mt-2">Chọn ảnh</div>
                </div>
              )}
            </Upload>

            {imagePreview && (
              <div>
                <Text strong>Xem trước:</Text>
                <Image
                  src={imagePreview}
                  alt="Preview"
                  className="mt-2 rounded-lg"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
            )}

            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              onClick={handleAnalyze}
              loading={isAnalyzing}
              disabled={fileList.length === 0}
              block
            >
              {isAnalyzing ? 'Đang phân tích...' : 'Phân tích ảnh'}
            </Button>

            {isAnalyzing && (
              <div className="text-center">
                <Spin size="large" />
                <Text className="block mt-2">
                  AI đang đọc và phân tích nhãn thuốc...
                </Text>
              </div>
            )}

            {error && (
              <Alert
                message="Lỗi"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError('')}
              />
            )}
          </Space>
        </Card>

        {/* Kết quả phân tích */}
        {analysisResult && (
          <Card
            title="📊 Kết quả phân tích"
            className="h-fit"
            extra={
              <Tag
                icon={getWarningDisplay(analysisResult.warning_level).icon}
                color={getWarningDisplay(analysisResult.warning_level).color}
                className="text-base px-4 py-1"
              >
                {getWarningDisplay(analysisResult.warning_level).text}
              </Tag>
            }
          >
            <Space direction="vertical" className="w-full" size="large">
              {/* Tên sản phẩm */}
              {analysisResult.product_name && (
                <div>
                  <Text strong>Tên sản phẩm:</Text>
                  <Paragraph className="text-lg text-blue-600">
                    {analysisResult.product_name}
                  </Paragraph>
                </div>
              )}

              {/* Hoạt chất phát hiện */}
              <div>
                <Text strong>Hoạt chất phát hiện:</Text>
                <div className="mt-2">
                  {analysisResult.detected_ingredients.length > 0 ? (
                    analysisResult.detected_ingredients.map((ing, idx) => (
                      <Tag key={idx} color="blue" className="mb-2">
                        {ing}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không phát hiện hoạt chất rõ ràng</Text>
                  )}
                </div>
              </div>

              {/* Hoạt chất bị cấm */}
              {analysisResult.banned_ingredients.length > 0 && (
                <div>
                  <Text strong className="text-red-600">
                    ⚠️ Hoạt chất BỊ CẤM phát hiện:
                  </Text>
                  <div className="mt-2">
                    {analysisResult.banned_ingredients.map((ing, idx) => (
                      <Tag key={idx} color="red" className="mb-2 text-base">
                        {ing}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Hoạt chất bị hạn chế/cảnh báo */}
              {analysisResult.restricted_ingredients && analysisResult.restricted_ingredients.length > 0 && (
                <div>
                  <Text strong className="text-yellow-600">
                    ⚠️ Hoạt chất HẠN CHẾ / CẢNH BÁO phát hiện:
                  </Text>
                  <div className="mt-2">
                    {analysisResult.restricted_ingredients.map((ing, idx) => (
                      <Tag key={idx} color="gold" className="mb-2 text-base text-black">
                        {ing}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông báo cảnh báo */}
              <Alert
                message={analysisResult.warning_message}
                type={
                  analysisResult.is_banned
                    ? 'error'
                    : analysisResult.is_restricted
                    ? 'warning' // Cam/Vàng cho warning/restricted
                    : analysisResult.warning_level === 'AN_TOÀN'
                    ? 'success'
                    : 'warning'
                }
                showIcon
              />

              {/* Khuyến nghị */}
              {analysisResult.recommendations && (
                <div>
                  <Text strong>💡 Khuyến nghị:</Text>
                  <Paragraph className="mt-2 bg-blue-50 p-3 rounded">
                    {analysisResult.recommendations}
                  </Paragraph>
                </div>
              )}
            </Space>
          </Card>
        )}
      </div>

      {/* Danh sách hoạt chất bị cấm và hạn chế */}
      <Card title="📋 Danh sách hoạt chất bị cấm và hạn chế tại Việt Nam" className="mt-6">
        <Collapse accordion defaultActiveKey={['restricted']}>
          {/* Panel cho chất hạn chế (Mở mặc định để user thấy) */}
          <Panel
            header={
              <div className="flex justify-between items-center text-yellow-700 font-semibold">
                <Space><WarningOutlined /> Danh sách hoạt chất Hạn chế / Cảnh báo đặc biệt</Space>
                <Tag color="gold">{RESTRICTED_INGREDIENTS.length} hoạt chất</Tag>
              </div>
            }
            key="restricted"
          >
             <Alert message="Lưu ý: Các hoạt chất này cần sử dụng hết sức cẩn trọng hoặc đang trong lộ trình cấm." type="warning" className="mb-2" />
             <List
              size="small"
              dataSource={RESTRICTED_INGREDIENTS}
              renderItem={(item, index) => (
                <List.Item>
                  <Text>
                    {index + 1}. {item}
                  </Text>
                </List.Item>
              )}
            />
          </Panel>

          {/* Các Panel cho chất cấm */}
          {Object.entries(BANNED_INGREDIENTS_BY_TYPE).map(([key, value]) => (
            <Panel
              header={
                <div className="flex justify-between items-center text-red-600">
                  <Text strong type="danger">{value.name}</Text>
                  <Tag color="red">{value.count} hoạt chất</Tag>
                </div>
              }
              key={key}
            >
              <List
                size="small"
                dataSource={value.ingredients}
                renderItem={(item, index) => (
                  <List.Item>
                    <Text>
                      {index + 1}. {item}
                    </Text>
                  </List.Item>
                )}
              />
            </Panel>
          ))}
        </Collapse>

        <Alert
          message="Tổng hợp"
          description={
            <div>
              <p>- Có <b>{ALL_BANNED_INGREDIENTS.length}</b> hoạt chất BỊ CẤM HOÀN TOÀN.</p>
              <p>- Có <b>{RESTRICTED_INGREDIENTS.length}</b> hoạt chất HẠN CHẾ / CẢNH BÁO.</p>
            </div>
          }
          type="info"
          showIcon
          className="mt-4"
        />
      </Card>
    </div>
  );
};

export default BannedPesticidesPage;
