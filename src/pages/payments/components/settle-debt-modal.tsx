import * as React from "react"
import {
  Button,
  Form,
  InputNumber,
  Select,
  Modal,
  Input,
  Card,
  Alert,
  Spin,
  Divider,
  Tag,
  Space,
  Checkbox,
  Tabs,
  Table,
} from "antd"
import { format } from "date-fns"
import { GiftOutlined } from '@ant-design/icons';
import NumberInput from '@/components/common/number-input'
import { useRewardPreviewQuery, useDebtNoteQuery } from "@/queries/debt-note"
import {
  useCustomerDebtsQuery,
  useCustomerDebtorsSearchQuery,
  useCustomerInvoicesQuery,
  useCustomerDebtSummaryQuery,
} from "@/queries/customer"
import { useSeasonsQuery } from "@/queries/season"
import { Season } from "@/models/season"
import { CustomerDebtor } from "@/models/customer"
import { useSettleAndRolloverMutation } from "@/queries/payment"

interface SettleDebtModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
  initialValues?: {
    customer_id?: number
    season_id?: number
    debt_note_id?: number
  }
  initialCustomer?: CustomerDebtor
}

export const SettleDebtModal: React.FC<SettleDebtModalProps> = ({
  open,
  onCancel,
  onSuccess,
  initialValues,
  initialCustomer,
}) => {
  const [form] = Form.useForm()
  
  // State
  // selectedCustomer lưu thông tin hiển thị trên Dropdown (bao gồm tổng nợ toàn cục)
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerDebtor | null>(null)
  const [selectedSeason, setSelectedSeason] = React.useState<number | null>(null)
  const [debtorSearch, setDebtorSearch] = React.useState("")
  // State lưu kết quả chốt sổ
  const [settleResult, setSettleResult] = React.useState<any>(null)
  const [showResult, setShowResult] = React.useState(false)

  // Queries
  // Chỉ load danh sách khi modal mở để tránh gọi API thừa
  const { data: debtors, isLoading: isLoadingDebtors } = useCustomerDebtorsSearchQuery(debtorSearch, { enabled: open })
  const { data: seasons } = useSeasonsQuery()

  // Queries phụ thuộc vào selection và luôn FETCH để đảm bảo tính đúng nợ từng mùa vụ
  const customerId = Form.useWatch('customer_id', form) || initialValues?.customer_id
  const shouldFetchDetails = !!customerId
  
  const { data: customerInvoices } = useCustomerInvoicesQuery(shouldFetchDetails ? (customerId || 0) : 0)
  const { data: customerDebts } = useCustomerDebtsQuery(shouldFetchDetails ? (customerId || 0) : 0)
  
  // Lấy debt summary của khách hàng đã chọn
  const { data: debtSummary, isLoading: isLoadingDebtSummary } = useCustomerDebtSummaryQuery(customerId || 0)

  // Lấy preview quà tặng nếu có debt_note_id
  const debtNoteId = initialValues?.debt_note_id
  const settleAmount = Form.useWatch("amount", form) || 0
  const { data: rewardPreview, isLoading: isLoadingReward } = useRewardPreviewQuery(debtNoteId || 0, settleAmount)
  
  // Lấy chi tiết phiếu nợ để kiểm tra trạng thái (Tránh hiển thị tích lũy lần 2 khi đã chốt sổ)
  const { data: debtNote } = useDebtNoteQuery(debtNoteId || 0)
  const isAlreadySettled = debtNote?.status === 'settled'

  // Mutation
  const settleAndRolloverMutation = useSettleAndRolloverMutation()

  // Group invoices theo rice_crop_id cho cả hiển thị và form
  const breakdown = React.useMemo(() => {
    if (!customerInvoices || customerInvoices.length === 0) return [];
    
    const invoicesByRiceCrop = new Map<number | null, any>();
    customerInvoices.forEach((invoice: any) => {
      const riceCropId = invoice.rice_crop_id || null;
      const fieldName = invoice.rice_crop?.field_name || 'Không thuộc Ruộng lúa nào';
      
      if (!invoicesByRiceCrop.has(riceCropId)) {
        invoicesByRiceCrop.set(riceCropId, {
          rice_crop_id: riceCropId,
          field_name: fieldName,
          invoices: [],
          total_debt: 0,
        });
      }
      
      const group = invoicesByRiceCrop.get(riceCropId)!;
      group.invoices.push(invoice);
      group.total_debt += Number(invoice.remaining_amount || 0);
    });
    
    return Array.from(invoicesByRiceCrop.values());
  }, [customerInvoices]);

  // Effects
  React.useEffect(() => {
    if (open) {
      form.resetFields()
      setDebtorSearch("")
      setSelectedCustomer(null)
      setSelectedSeason(null)

      if (initialValues) {
        form.setFieldsValue({
          customer_id: initialValues.customer_id,
          season_id: initialValues.season_id,
          payment_method: 'cash',
          is_final: false
        })
        
        if (initialValues.season_id) {
          setSelectedSeason(initialValues.season_id)
        }
      }

      // Optimization: Fill data ngay nếu có info customer
      if (initialCustomer) {
        setSelectedCustomer(initialCustomer)
        // Lưu ý: Không set amount ngay từ initialCustomer nữa vì đó chỉ là nợ của 1 phiếu
        // Chúng ta sẽ đợi API trả về hoặc tính toán lại
        
        // Trigger fetch fresh data
        if (initialCustomer.code) {
           setDebtorSearch(initialCustomer.code)
        } else if (initialCustomer.name) {
           setDebtorSearch(initialCustomer.name)
        }
      }
    }
  }, [open, initialValues, form, initialCustomer])

  // Khi debtors load xong, update lại selectedCustomer để có thông tin Total Debt mới nhất
  React.useEffect(() => {
     if (initialValues?.customer_id && debtors && debtors.length > 0) {
        const debtor = debtors.find(d => d.id === initialValues.customer_id)
        
        // Trường hợp 1: Chưa có selectedCustomer
        if (!selectedCustomer && !initialCustomer) {
            if (debtor) setSelectedCustomer(debtor)
        }
        
        // Trường hợp 2: Đã có selectedCustomer (có thể là initial fake), update info xịn từ API
        if (selectedCustomer && debtor && debtor.id === selectedCustomer.id) {
             // Chỉ update nếu data nợ khác nhau
             if (debtor.total_debt !== selectedCustomer.total_debt || debtor.debt_count !== selectedCustomer.debt_count) {
                 setSelectedCustomer(debtor)
                 
                 // Nếu người dùng chưa nhập số tiền, tự động fill số nợ MỚI NHẤT
                 // Tuy nhiên logic tính nợ mùa vụ nằm ở calculateDebtBySeason, nên ta không set cứng ở đây vội
             }
        }
     }
  }, [debtors, initialValues, selectedCustomer, initialCustomer])

  // Handlers
  const handleDebtorSelect = (value: number) => {
    const debtorInList = debtors?.find((d) => d.id === value)
    
    if (debtorInList) {
        setSelectedCustomer(debtorInList)
        // Khi chọn người mới, reset amount để user tự nhập hoặc tính lại
        // form.setFieldValue('amount', debtorInList.total_debt); 
        return
    }

    if (initialCustomer && value === initialCustomer.id) {
        setSelectedCustomer(initialCustomer)
        return
    }

    setSelectedCustomer(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value)
  }

  // Tính toán nợ thực tế của Mùa Vụ đang chọn dựa trên API customerDebts
  const calculateDebtBySeason = () => {
    // Luôn tính từ API customerDebts để chính xác nhất
    if (!selectedSeason || !customerDebts) return 0
    
    const safeParse = (val: any) => {
      if (val === undefined || val === null) return 0
      const num = parseFloat(val)
      return isNaN(num) ? 0 : num
    }

    const seasonDebts = customerDebts.filter(
      (debt: any) => debt.season_id === selectedSeason && ['active', 'overdue', 'settled'].includes(debt.status)
    )
    
    return seasonDebts.reduce(
      (sum: number, debt: any) => sum + safeParse(debt.remaining_amount),
      0
    )
  }
  
  // 🆕 Dùng ref để theo dõi đã auto-fill cho cặp (KH, Mùa vụ) nào chưa
  const autoFilledKeyRef = React.useRef<string | null>(null);

  // Khi modal đóng/mở, reset key để sẵn sàng auto-fill lại
  React.useEffect(() => {
    if (open) {
      autoFilledKeyRef.current = null;
    }
  }, [open]);

  // Effect để xóa dữ liệu form khi đóng modal
  React.useEffect(() => {
    if (!open) {
      form.setFieldValue('amount', 0);
    }
  }, [open, form]);

  // Effect để auto-fill amount khi có dữ liệu nợ thực tế
  const debtAmount = calculateDebtBySeason()
  React.useEffect(() => {
    const currentKey = `${customerId}-${selectedSeason}`;
    
    // Chỉ tự động điền nếu modal đang mở, có nợ > 0 và CHƯA auto-fill cho Key hiện tại
    if (open && debtAmount > 0 && autoFilledKeyRef.current !== currentKey) {
        form.setFieldValue('amount', debtAmount);
        autoFilledKeyRef.current = currentKey;
        console.log(`[Auto-fill] Set amount to ${debtAmount} for ${currentKey}`);
    }
  }, [open, debtAmount, customerId, selectedSeason, form])


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        customer_id: values.customer_id,
        season_id: values.season_id,
        amount: values.amount,
        payment_method: values.payment_method,
        notes: values.notes,
        gift_description: values.gift_description,
        gift_value: values.gift_value,
        is_final: values.is_final,
        manual_remaining_amount: values.manual_remaining_amount,
        rice_crop_id: values.rice_crop_id, // ✅ Gửi ID ruộng lúa lên backend
        gift_status: values.gift_status, // ✅ Gửi trạng thái quà tặng
      }
      
      await settleAndRolloverMutation.mutateAsync(submitData, {
        onSuccess: (response) => {
          // Lưu kết quả và hiển thị modal kết quả
          setSettleResult(response)
          setShowResult(true)
          onSuccess?.()
          // Đóng modal form
          onCancel()
        },
      })
    } catch (error) {
      console.error("Form validation failed:", error)
    }
  }
  
  // Logic hiển thị options
  const safeDebtors = debtors || []
  const displayDebtors = initialCustomer && !safeDebtors.find(d => d.id === initialCustomer.id) 
      ? [initialCustomer, ...safeDebtors] 
      : safeDebtors

  const debtorOptions = displayDebtors.map((c: CustomerDebtor) => {
    // Lấy debt summary từ API nếu đây là customer đang được chọn
    const isSelected = c.id === customerId
    const displayDebt = isSelected && debtSummary ? (debtSummary.total_debt || 0) : (c.total_debt || 0)
    const displayCount = isSelected && debtSummary ? (debtSummary.debt_note_count || 0) : (c.debt_count || 0)
    
    return {
      value: c.id,
      label: (
        <div className="flex justify-between items-center w-full">
           <span>{c.name} - {c.phone}</span>
           {isSelected && isLoadingDebtSummary ? (
             <span className="text-gray-400 font-medium ml-2">
               Đang tải...
             </span>
           ) : (
             <span className="text-red-500 font-medium ml-2">
               Nợ: {formatCurrency(Number(displayDebt) || 0)} ({Number(displayCount) || 0} phiếu)
             </span>
           )}
        </div>
      ),
      filterText: `${c.name} ${c.phone} ${c.code}`, 
    }
  })


  return (
    <>
    <Modal
      title='Thanh toán công nợ'
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key='cancel' onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key='submit'
          type='primary'
          loading={settleAndRolloverMutation.isPending}
          onClick={handleSubmit}
        >
          Xác nhận thanh toán
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout='vertical' className='mt-4'>
        <Form.Item
          label='Khách hàng (Chỉ hiện người đang nợ)'
          name='customer_id'
          rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
        >
          <Select
            showSearch
            placeholder='Tìm người nợ...'
            defaultActiveFirstOption={false}
            showArrow={false}
            filterOption={false}
            onSearch={setDebtorSearch}
            onChange={handleDebtorSelect}
            loading={isLoadingDebtors}
            notFoundContent={isLoadingDebtors ? "Đang tìm..." : "Không tìm thấy khách hàng nợ"}
            options={debtorOptions}
            className="w-full"
            disabled={!!initialValues?.customer_id} // Disable nếu được mở từ shortcut
          />
        </Form.Item>

        <Form.Item
          label='Mùa vụ cần chốt'
          name='season_id'
          rules={[{ required: true, message: "Vui lòng chọn mùa vụ" }]}
        >
          <Select 
            placeholder='Chọn mùa vụ'
            onChange={(value) => setSelectedSeason(value)}
            disabled={!!initialValues?.season_id} // Disable nếu được mở từ shortcut
          >
            {seasons?.data?.items?.map((season: Season) => (
              <Select.Option key={season.id} value={season.id}>
                {season.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Luôn hiển thị thông tin nợ nếu có data */}
        {(selectedCustomer || customerId) && selectedSeason && (() => {
          // Show loading if data is being fetched
          const isLoadingData = !customerInvoices && shouldFetchDetails;
          
          if (isLoadingData) {
            return (
              <Card className='mb-4' style={{ background: '#f6ffed', border: '1px solid #b7eb8f', textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" tip="Đang tải thông tin công nợ..." />
              </Card>
            );
          }

          // Group invoices theo rice_crop_id (Đã xử lý trong useMemo breakdown ở trên)
          return (
            <Card className='mb-4' style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <div className='text-gray-600 text-sm font-medium mb-2'>
                Tổng công nợ của mùa vụ này
              </div>
              <div className='text-2xl font-bold text-red-600 mb-3'>
                {formatCurrency(debtAmount)}
              </div>
              <div className='text-sm text-gray-500 mb-3'>
                Gồm {customerInvoices?.length || 0} hóa đơn chưa thanh toán đủ
                <br />
                (Hệ thống tự động phân bổ theo thứ tự FIFO)
              </div>

              {/* Breakdown theo mảnh ruộng */}
              {breakdown.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #d9f7be' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 12, color: '#52c41a' }}>
                    📊 Chi tiết theo mảnh ruộng:
                  </div>
                  {breakdown.map((crop: any, index: number) => (
                    <div 
                      key={crop.rice_crop_id || `no-crop-${index}`}
                      style={{ 
                        background: 'white',
                        padding: '8px',
                        borderRadius: '6px',
                        marginBottom: 6,
                        border: '1px solid #d9f7be'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, fontSize: '13px' }}>
                          {crop.field_name}
                        </span>
                        <span style={{ 
                          background: '#e6f7ff', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1890ff'
                        }}>
                          {crop.invoices.length} hóa đơn
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                        <strong>Tổng nợ:</strong> {formatCurrency(crop.total_debt)}
                      </div>
                      {/* Danh sách hóa đơn - Thu nhỏ và có scroll */}
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#999', 
                        marginTop: 6,
                        maxHeight: '120px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        lineHeight: '1.2'
                      }}>
                        {crop.invoices.map((inv: any, idx: number) => (
                          <div key={inv.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            padding: '2px 0',
                            borderTop: idx > 0 ? '1px solid #f5f5f5' : 'none',
                            lineHeight: '1.2'
                          }}>
                            <span style={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '60%'
                            }}>{inv.code}</span>
                            <span style={{ fontWeight: 500, color: '#666' }}>
                              {formatCurrency(inv.remaining_amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })()}

        <div className='grid grid-cols-2 gap-4'>
          <Form.Item
            label='Số tiền khách trả'
            name='amount'
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <NumberInput
              className='w-full'
              min={0}
              placeholder='Nhập số tiền'
            />
          </Form.Item>

          <Form.Item
            label='Phương thức'
            name='payment_method'
            initialValue='cash'
          >
            <Select>
              <Select.Option value='cash'>Tiền mặt</Select.Option>
              <Select.Option value='transfer'>Chuyển khoản</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {settleAmount > 0 && debtAmount > 0 && settleAmount < debtAmount && (
          <Alert
            type='warning'
            showIcon
            message={`⚠️ Còn thiếu: ${formatCurrency(debtAmount - settleAmount)}`}
            description='Nợ này sẽ tiếp tục được theo dõi ở mùa vụ hiện tại cho đến khi được thanh toán hết.'
            className='mb-4'
          />
        )}


        <Form.Item label='Ghi chú' name='notes'>
          <Input.TextArea rows={3} placeholder='Nhập ghi chú (tùy chọn)' />
        </Form.Item>

        {/* Checkbox Chốt sổ thủ công đã được ẩn đi vì hệ thống tự động chốt khi trả hết nợ */}

        <Divider orientation="left" style={{ margin: '16px 0 12px' }}>
                <Space>
                  <GiftOutlined style={{ color: '#faad14' }} />
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>Thông tin Quà tặng</span>
                </Space>
        </Divider>

        <Form.Item 
          label="Ruộng lúa liên quan (để lưu lịch sử quà tặng)" 
          name="rice_crop_id"
          help="Nếu tặng quà, hãy chọn ruộng lúa tương ứng để dễ dàng quản lý"
        >
          <Select placeholder="Chọn ruộng lúa" allowClear>
            {breakdown.map(crop => (
              <Select.Option key={crop.rice_crop_id} value={crop.rice_crop_id}>
                {crop.field_name} (Nợ: {formatCurrency(crop.total_debt)})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Form.Item label="Mô tả quà tri ân" name="gift_description" className="mb-2">
            <Input placeholder="VD: Bộ ấm trà, Nón bảo hiểm..." />
          </Form.Item>
          <Form.Item label="Giá trị quà" name="gift_value" className="mb-2">
            <NumberInput placeholder="Giá trị VND" />
          </Form.Item>
        </div>

        <Form.Item label="Trạng thái quà tặng" name="gift_status" initialValue="delivered">
          <Select>
            <Select.Option value="delivered">Đã trao ngay</Select.Option>
            <Select.Option value="pending">Chờ trao sau</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    {/* Modal hiển thị kết quả chốt sổ */}
    <Modal
      title="✅ Thanh toán công nợ thành công"
      open={showResult}
      onCancel={() => setShowResult(false)}
      footer={[
        <Button key="close" type="primary" onClick={() => setShowResult(false)}>
          Đóng
        </Button>
      ]}
      width={800}
    >
      {settleResult && (
        <div>
          {/* Tổng quan */}
          <Card className='mb-4' style={{ background: '#f6ffed' }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Tổng nợ:</strong> {formatCurrency(settleResult.total_debt)}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: '#52c41a' }}>Đã thanh toán:</strong> {formatCurrency(settleResult.payment?.amount || 0)}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: settleResult.remaining_debt > 0 ? '#ff4d4f' : '#52c41a' }}>
                Còn nợ:
              </strong> {formatCurrency(settleResult.remaining_debt)}
            </div>
            
            {/* Hiển thị quà tặng */}
            {settleResult.gift_description && (
              <div style={{ marginTop: 12, padding: '12px', background: '#fff9e6', borderRadius: '4px' }}>
                <strong>🎁 Quà tặng:</strong> {formatCurrency(settleResult.gift_value)}
                <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                  {settleResult.gift_description}
                </div>
              </div>
            )}
          </Card>

          {/* Breakdown theo mảnh ruộng */}
          {settleResult.breakdown_by_rice_crop && settleResult.breakdown_by_rice_crop.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 16 }}>📊 Chi tiết theo mảnh ruộng</h3>
              {settleResult.breakdown_by_rice_crop.map((crop: any, index: number) => (
                <Card 
                  key={crop.rice_crop_id || `no-crop-${index}`} 
                  className='mb-3'
                  style={{ borderLeft: '4px solid #52c41a' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ margin: 0 }}>
                      {crop.field_name}
                    </h4>
                    <span style={{ 
                      background: '#e6f7ff', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {crop.invoice_count} hóa đơn
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <strong>Tổng nợ:</strong> {formatCurrency(crop.total_debt)}
                  </div>

                  {/* Danh sách hóa đơn */}
                  <div style={{ 
                    background: '#fafafa', 
                    padding: '12px', 
                    borderRadius: '4px',
                    marginTop: 12
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: 8 }}>
                      Danh sách hóa đơn:
                    </div>
                    {crop.invoices.map((invoice: any) => (
                      <div 
                        key={invoice.id}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <span style={{ fontSize: '13px' }}>{invoice.code}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>
                          {formatCurrency(invoice.remaining_amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Danh sách hóa đơn đã thanh toán */}
          {settleResult.settled_invoices && settleResult.settled_invoices.length > 0 && (
            <Card className='mt-4'>
              <h3 style={{ marginBottom: 12 }}>
                ✅ Hóa đơn đã thanh toán ({settleResult.settled_invoices.length})
              </h3>
              <div>
                {settleResult.settled_invoices.map((invoice: any) => (
                  <div 
                    key={invoice.id}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <span>{invoice.code}</span>
                    <span style={{ 
                      color: invoice.payment_status === 'paid' ? '#52c41a' : '#faad14',
                      fontWeight: 500
                    }}>
                      {invoice.payment_status === 'paid' ? '✓ Đã thanh toán' : '◐ Thanh toán một phần'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </Modal>
    </>
  )
}
