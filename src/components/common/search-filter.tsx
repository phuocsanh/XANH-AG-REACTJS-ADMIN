import React, { useState, useEffect } from 'react';
import { Input, Select, DatePicker, Button, Form, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface FilterOption {
  label: string;
  value: string | number;
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange';
  placeholder?: string;
  options?: FilterOption[];
  allowClear?: boolean;
  mode?: 'multiple' | 'tags';
}

interface SearchFilterProps {
  searchPlaceholder?: string;
  filterFields?: FilterField[];
  onSearch?: (searchValue: string) => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onReset?: () => void;
  showSearch?: boolean;
  showReset?: boolean;
  loading?: boolean;
  defaultValues?: Record<string, unknown>;
  layout?: 'horizontal' | 'vertical';
  responsive?: boolean;
}

/**
 * Component SearchFilter tái sử dụng
 * Hỗ trợ tìm kiếm text và các bộ lọc đa dạng
 * Có thể tùy chỉnh layout và responsive
 * Tích hợp với Form của Ant Design
 */
const SearchFilter: React.FC<SearchFilterProps> = ({
  searchPlaceholder = 'Tìm kiếm...',
  filterFields = [],
  onSearch,
  onFilter,
  onReset,
  showSearch = true,
  showReset = true,
  loading = false,
  defaultValues = {},
  layout = 'horizontal',
  responsive = true,
}) => {
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState<string>('');

  // Khởi tạo giá trị mặc định
  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      form.setFieldsValue(defaultValues);
    }
  }, [defaultValues, form]);

  // Xử lý tìm kiếm
  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  // Xử lý thay đổi filter
  const handleFilterChange = () => {
    const values = form.getFieldsValue();
    onFilter?.(values);
  };

  // Xử lý reset
  const handleReset = () => {
    form.resetFields();
    setSearchValue('');
    onReset?.();
  };

  // Render filter field dựa trên type
  const renderFilterField = (field: FilterField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder}
            allowClear={field.allowClear}
            onChange={handleFilterChange}
          />
        );

      case 'select':
        return (
          <Select
            placeholder={field.placeholder}
            allowClear={field.allowClear}
            mode={field.mode}
            onChange={handleFilterChange}
            style={{ width: '100%' }}
          >
            {field.options?.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'date':
        return (
          <DatePicker
            placeholder={field.placeholder}
            allowClear={field.allowClear}
            onChange={handleFilterChange}
            style={{ width: '100%' }}
          />
        );

      case 'dateRange':
        return (
          <RangePicker
            placeholder={['Từ ngày', 'Đến ngày']}
            allowClear={field.allowClear}
            onChange={handleFilterChange}
            style={{ width: '100%' }}
          />
        );

      default:
        return null;
    }
  };

  // Responsive columns
  const getColProps = () => {
    if (!responsive) {
      return { span: 24 / Math.max(filterFields.length + (showSearch ? 1 : 0) + (showReset ? 1 : 0), 1) };
    }

    return {
      xs: 24,
      sm: 12,
      md: 8,
      lg: 6,
      xl: 4,
    };
  };

  return (
    <div className="search-filter-wrapper" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout={layout}
        onValuesChange={handleFilterChange}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* Search Input */}
          {showSearch && (
            <Col {...getColProps()}>
              <Search
                placeholder={searchPlaceholder}
                allowClear
                enterButton={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onSearch={handleSearch}
                loading={loading}
              />
            </Col>
          )}

          {/* Filter Fields */}
          {filterFields.map((field) => (
            <Col key={field.key} {...getColProps()}>
              <Form.Item
                name={field.key}
                label={layout === 'vertical' ? field.label : undefined}
                style={{ marginBottom: layout === 'horizontal' ? 0 : undefined }}
              >
                {renderFilterField(field)}
              </Form.Item>
            </Col>
          ))}

          {/* Reset Button */}
          {showReset && (
            <Col {...getColProps()}>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={loading}
              >
                Đặt lại
              </Button>
            </Col>
          )}
        </Row>
      </Form>
    </div>
  );
};

export default SearchFilter;
export type { FilterField, FilterOption, SearchFilterProps };