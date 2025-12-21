
import React from 'react';
import { Input, Select } from 'antd';
import ComboBox, { ComboBoxProps } from './combo-box';

interface FilterHeaderProps {
  title: string;
  dataIndex?: string; // Optional if not used for binding directly
  value: any;
  onChange: (value: any) => void;
  inputType?: 'text' | 'select' | 'date' | 'combobox';
  options?: { label: string; value: any }[]; // For select input
  comboBoxProps?: Partial<ComboBoxProps>; // For combobox input
}

const FilterHeader: React.FC<FilterHeaderProps> = ({ 
  title, 
  value, 
  onChange, 
  inputType = 'text',
  options,
  comboBoxProps
}) => {
  const [innerValue, setInnerValue] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync internal state when external prop changes (e.g. Clear Filters)
  React.useEffect(() => {
    setInnerValue(value);
  }, [value]);

  // Clean up timeout on unmount
  React.useEffect(() => {
      return () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
  }, []);

  const handleTextChange = (val: string) => {
    setInnerValue(val);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
        onChange(val);
    }, 1500); // 1.5s delay
  };

  const handleSelectChange = (val: any) => {
      setInnerValue(val);
      onChange(val); // Immediate for select
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          onChange(innerValue);
      }
  };

  return (
    <div className="flex flex-col gap-2 py-1" onClick={(e) => e.stopPropagation()}>
      <div className="font-semibold text-gray-700">{title}</div>
      {inputType === 'text' && (
        <Input
          placeholder={`Tìm ${title}...`}
          size="small"
          value={innerValue}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          allowClear
          className="font-normal"
        />
      )}
      {inputType === 'select' && (
        <Select
            placeholder="Tất cả" 
            size="small" 
            value={innerValue} 
            onChange={handleSelectChange}
            allowClear
            className="font-normal w-full"
            options={options}
        />
      )}
      {inputType === 'combobox' && (
        <ComboBox
            placeholder="Tất cả" 
            size="small" 
            value={innerValue} 
            onChange={handleSelectChange}
            allowClear
            className="font-normal w-full"
            {...comboBoxProps}
        />
      )}
    </div>
  );
};

export default FilterHeader;
