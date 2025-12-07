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
} from "antd"
import {
  useCustomerDebtsQuery,
  useCustomerDebtorsSearchQuery,
  useCustomerInvoicesQuery,
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

  // Queries
  // Luôn load danh sách search để lấy thông tin nợ chính xác nhất từ API
  const { data: debtors, isLoading: isLoadingDebtors } = useCustomerDebtorsSearchQuery(debtorSearch)
  const { data: seasons } = useSeasonsQuery()

  // Queries phụ thuộc vào selection và luôn FETCH để đảm bảo tính đúng nợ từng mùa vụ
  const customerId = Form.useWatch('customer_id', form) || initialValues?.customer_id
  const shouldFetchDetails = !!customerId
  
  const { data: customerInvoices } = useCustomerInvoicesQuery(shouldFetchDetails ? (customerId || 0) : 0)
  const { data: customerDebts } = useCustomerDebtsQuery(shouldFetchDetails ? (customerId || 0) : 0)

  // Watch form values
  const settleAmount = Form.useWatch("amount", form) || 0

  // Mutation
  const settleAndRolloverMutation = useSettleAndRolloverMutation()

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
          payment_method: 'cash'
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
      (debt: any) => debt.season_id === selectedSeason && debt.status === 'active'
    )
    
    return seasonDebts.reduce(
      (sum: number, debt: any) => sum + safeParse(debt.remaining_amount),
      0
    )
  }
  
  // Effect để auto-fill amount khi calculateDebtBySeason thay đổi và chưa có input
  const debtAmount = calculateDebtBySeason()
  React.useEffect(() => {
      // Chỉ auto fill khi mới mở modal hoặc đổi season và amount đang trống (hoặc bằng 0)
      // Để tránh override input của user
      if (debtAmount > 0) {
           const currentAmount = form.getFieldValue('amount')
           if (!currentAmount || currentAmount === 0 || (initialCustomer && currentAmount === initialCustomer.total_debt)) {
               form.setFieldValue('amount', debtAmount)
           }
      }
  }, [debtAmount, form, initialCustomer])


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        customer_id: values.customer_id,
        season_id: values.season_id,
        amount: values.amount,
        payment_method: values.payment_method,
        notes: values.notes,
      }
      
      await settleAndRolloverMutation.mutateAsync(submitData, {
        onSuccess: () => {
          onSuccess?.()
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

  const debtorOptions = displayDebtors.map((c: CustomerDebtor) => ({
      value: c.id,
      label: (
        <div className="flex justify-between items-center w-full">
           <span>{c.name} - {c.phone}</span>
           <span className="text-red-500 font-medium ml-2">
             Nợ: {formatCurrency(c.total_debt)} ({c.debt_count} phiếu)
           </span>
        </div>
      ),
      filterText: `${c.name} ${c.phone} ${c.code}`, 
    }))

  return (
    <Modal
      title='Chốt sổ công nợ'
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
          Xác nhận chốt sổ
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
        {(selectedCustomer || customerId) && selectedSeason && (
          <Card className='mb-4 bg-gray-50'>
            <div className='text-gray-500 text-sm'>
              Tổng công nợ của mùa vụ này
            </div>
            <div className='text-2xl font-bold text-red-600'>
              {formatCurrency(debtAmount)}
            </div>
            {shouldFetchDetails ? (
                <div className='text-sm text-gray-500 mt-2'>
                  Gồm {customerInvoices?.length || 0} hóa đơn chưa thanh toán đủ
                </div>
            ) : (
                 <div className='text-sm text-gray-500 mt-2'>
                  Thông tin từ danh sách
                </div>
            )}
            <div className='text-sm text-gray-500'>
              (Hệ thống tự động phân bổ theo thứ tự FIFO)
            </div>
          </Card>
        )}

        <div className='grid grid-cols-2 gap-4'>
          <Form.Item
            label='Số tiền khách trả'
            name='amount'
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              className='w-full'
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => (value ? value.replace(/\$\s?|(,*)/g, "") : "") as any}
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
            description='Nợ này sẽ giữ nguyên ở mùa vụ hiện tại (phiếu nợ chuyển sang trạng thái "Đã chốt sổ")'
            className='mb-4'
          />
        )}

        <Form.Item label='Ghi chú' name='notes'>
          <Input.TextArea rows={3} placeholder='Nhập ghi chú (tùy chọn)' />
        </Form.Item>
      </Form>
    </Modal>
  )
}
