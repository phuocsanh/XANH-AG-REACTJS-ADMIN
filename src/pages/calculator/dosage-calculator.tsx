import React, { useState } from 'react'
import { Card, Form, Select, Typography, Row, Col, Divider, Statistic, Tabs } from 'antd'
import { ExperimentOutlined, CalculatorOutlined } from '@ant-design/icons'
import NumberInput from '../../components/common/number-input'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

// Constants for conversion (to m2)
const AREA_UNITS = {
  HA: { value: 'ha', label: 'Hecta (ha)', toM2: 10000 },
  M2: { value: 'm2', label: 'Mét vuông (m2)', toM2: 1 },
  CONG_STD: { value: 'cong_1000', label: 'Công (1.000m2)', toM2: 1000 },
  CONG_MT: { value: 'cong_1296', label: 'Công (1.296m2)', toM2: 1296 },
}

// Constants for dosage units
const DOSAGE_UNITS = {
  L_HA: { value: 'l_ha', label: 'Lít / ha', type: 'liquid', factor: 1 },
  ML_HA: { value: 'ml_ha', label: 'ml / ha', type: 'liquid', factor: 0.001 },
  KG_HA: { value: 'kg_ha', label: 'kg / ha', type: 'solid', factor: 1 },
  G_HA: { value: 'g_ha', label: 'g / ha', type: 'solid', factor: 0.001 },
}

const DosageCalculator: React.FC = () => {
    return (
        <div className="p-2 md:p-6">
            <Card 
                title={<><CalculatorOutlined /> Tính Liều Lượng Thuốc</>} 
                className="shadow-md"
                bordered={false}
            >
                <Tabs defaultActiveKey="1" type="card">
                    <TabPane tab="Theo Diện Tích" key="1">
                        <AreaCalculator />
                    </TabPane>
                    <TabPane tab="Theo Tỷ Lệ / Ngâm Giống" key="2">
                        <RatioCalculator />
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    )
}

const AreaCalculator: React.FC = () => {
  const [form] = Form.useForm()
  
  // Default values
  const [values, setValues] = useState({
    dosageRate: 0,
    dosageUnit: 'l_ha',
    
    // Core calculation value (in m2)
    totalAreaM2: 0,

    // UI State fields
    congType: 'cong_1296', 
    congCount: 0, 
    areaInput: 0,
    areaUnit: 'm2',
  })

  // Start with default values set
  const [result, setResult] = useState<{
    amount: number
    unit: string
    display: string
  } | null>(null)

  // Handle calculation whenever values change
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // We need to determine which field triggered the change to sync the others
    // Since 'changedValues' only contains the changed field.
    
    let newTotalM2 = values.totalAreaM2
    let newCongCount = values.congCount
    let newAreaInput = values.areaInput
    
    // Check what changed
    if ('congCount' in changedValues || 'congType' in changedValues) {
        // Cong changed -> Update total M2 and Area Input
        const cCount = 'congCount' in changedValues ? Number(changedValues.congCount) : values.congCount
        const cType = 'congType' in changedValues ? changedValues.congType : values.congType
        
        const unit = Object.values(AREA_UNITS).find(u => u.value === cType)
        if (unit) {
             newTotalM2 = cCount * unit.toM2
             
             // Update Area Input (to match new total)
             // We keep Area Unit as is, just update the number
             const areaUnitVal = Object.values(AREA_UNITS).find(u => u.value === values.areaUnit)
             if (areaUnitVal) {
                 newAreaInput = parseFloat((newTotalM2 / areaUnitVal.toM2).toFixed(4)) // avoid long decimals
                 form.setFieldsValue({ areaInput: newAreaInput })
             }
        }
    } else if ('areaInput' in changedValues || 'areaUnit' in changedValues) {
        // Area Input changed -> Update total M2 and Cong Count
        const aInput = 'areaInput' in changedValues ? Number(changedValues.areaInput) : values.areaInput
        const aUnit = 'areaUnit' in changedValues ? changedValues.areaUnit : values.areaUnit
        
        const unit = Object.values(AREA_UNITS).find(u => u.value === aUnit)
        if (unit) {
            newTotalM2 = aInput * unit.toM2
            
            // Update Cong Count
            const congUnitVal = Object.values(AREA_UNITS).find(u => u.value === values.congType)
            if (congUnitVal) {
                newCongCount = parseFloat((newTotalM2 / congUnitVal.toM2).toFixed(4))
                form.setFieldsValue({ congCount: newCongCount })
            }
        }
    }

    // Update state
    const newState = {
        ...values,
        ...allValues,
        totalAreaM2: newTotalM2,
        congCount: 'congCount' in changedValues ? Number(changedValues.congCount) : newCongCount, // Ensure we use the exact input if user typed it
        areaInput: 'areaInput' in changedValues ? Number(changedValues.areaInput) : newAreaInput
    }
    setValues(newState)

    // Calculate Final Result
    calculate(Number(newState.dosageRate), newState.dosageUnit, newTotalM2)
  }

  const calculate = (rate: number, dUnit: string, totalM2: number) => {
    if (!rate || !totalM2) {
      setResult(null)
      return
    }

    // 1. Convert total m2 to hectares for calculation (Standard rate is per ha)
    const totalHa = totalM2 / 10000

    // 2. Calculate raw amount needed
    let totalAmount = rate * totalHa
    
    // 3. Determine display unit and format
    let resultUnit = ''
    let displayAmount = 0
    
    if (dUnit === 'l_ha') {
        if (totalAmount < 1 && totalAmount > 0) {
            displayAmount = totalAmount * 1000
            resultUnit = 'ml'
        } else {
            displayAmount = totalAmount
            resultUnit = 'Lít'
        }
    } else if (dUnit === 'ml_ha') {
        if (totalAmount >= 1000) {
            displayAmount = totalAmount / 1000
            resultUnit = 'Lít'
        } else {
            displayAmount = totalAmount
            resultUnit = 'ml'
        }
    } else if (dUnit === 'kg_ha') {
         if (totalAmount < 1 && totalAmount > 0) {
             displayAmount = totalAmount * 1000
             resultUnit = 'g'
         } else {
             displayAmount = totalAmount
             resultUnit = 'kg'
         }
    } else if (dUnit === 'g_ha') {
        if (totalAmount >= 1000) {
            displayAmount = totalAmount / 1000
            resultUnit = 'kg'
        } else {
            displayAmount = totalAmount
            resultUnit = 'g'
        }
    }

    setResult({
        amount: displayAmount,
        unit: resultUnit,
        display: `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(displayAmount)} ${resultUnit}`,
    })
  }

  return (
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
            <Form
              form={form}
              layout="vertical"
              initialValues={values}
              onValuesChange={handleValuesChange}
            >
              <Title level={5} className="mb-4">1. Thông tin quy định (trên chai thuốc)</Title>
              
              <Row gutter={10}>
                <Col span={14}>
                   <Form.Item label="Liều lượng khuyến cáo" name="dosageRate">
                      <NumberInput 
                        placeholder="VD: 1.5" 
                        size="large" 
                      />
                   </Form.Item>
                </Col>
                <Col span={10}>
                    <Form.Item label="Đơn vị" name="dosageUnit">
                        <Select size="large">
                            {Object.values(DOSAGE_UNITS).map(u => (
                                <Option key={u.value} value={u.value}>{u.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Title level={5} className="mb-4">2. Diện tích thực tế cần phun</Title>
              <Text type="secondary" className="mb-4 block text-xs">
                Nhập 1 trong 2 ô bên dưới, hệ thống sẽ tự động quy đổi:
              </Text>

              <Row gutter={10}>
                <Col span={14}>
                   <Form.Item label="C1: Nhập Số lượng công" name="congCount">
                      <NumberInput 
                        placeholder="VD: 5" 
                        size="large" 
                        addonAfter="công"
                      />
                   </Form.Item>
                </Col>
                <Col span={10}>
                    <Form.Item label="Loại công" name="congType">
                        <Select size="large">
                            <Option value={AREA_UNITS.CONG_MT.value}>{AREA_UNITS.CONG_MT.label}</Option>
                            <Option value={AREA_UNITS.CONG_STD.value}>{AREA_UNITS.CONG_STD.label}</Option>
                        </Select>
                    </Form.Item>
                </Col>
              </Row>

              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">HOẶC NHẬP TRỰC TIẾP</span>
                  <div className="flex-grow border-t border-gray-200"></div>
              </div>

               <Row gutter={10}>
                   <Col span={14}>
                      <Form.Item label="C2: Diện tích tổng" name="areaInput">
                         <NumberInput
                            placeholder="VD: 10000" 
                            size="large" 
                         />
                      </Form.Item>
                   </Col>
                   <Col span={10}>
                       <Form.Item label="Đơn vị tính" name="areaUnit">
                           <Select size="large">
                               <Option value={AREA_UNITS.M2.value}>{AREA_UNITS.M2.label}</Option>
                               <Option value={AREA_UNITS.HA.value}>{AREA_UNITS.HA.label}</Option>
                           </Select>
                       </Form.Item>
                   </Col>
               </Row>
            </Form>
        </Col>

        <Col xs={24} md={12}>
           <Card 
             className="shadow-md h-full bg-blue-50" 
             bordered={false}
             style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
           >
              <div className="text-center">
                 <Title level={4} type="secondary">KẾT QUẢ TÍNH TOÁN</Title>
                 
                 <div className="my-8">
                    {result ? (
                        <>
                            <Text className="block text-gray-500 mb-2">
                                Lượng thuốc cần dùng cho 
                                <span className="font-bold text-gray-700 mx-1">
                                    {(values.congCount > 0) 
                                        ? `${values.congCount} ${Object.values(AREA_UNITS).find(u => u.value === values.congType)?.label}`
                                        : `${values.areaInput} ${Object.values(AREA_UNITS).find(u => u.value === values.areaUnit)?.label}`
                                    }
                                </span>
                                (tương đương {values.totalAreaM2.toLocaleString('vi-VN')} m2) là:
                            </Text>
                            <Statistic 
                                value={result.amount} 
                                precision={2}
                                suffix={<span className="text-2xl font-bold ml-1">{result.unit}</span>}
                                valueStyle={{ color: '#1890ff', fontSize: '3rem', fontWeight: 'bold' }}
                            />
                        </>
                    ) : (
                        <div className="text-gray-400 py-10">
                            <ExperimentOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                            <p>Nhập thông tin bên m trái để xem kết quả</p>
                        </div>
                    )}
                 </div>

                 {result && (
                     <div className="bg-white p-4 rounded-lg border border-blue-100 text-left">
                         <Text strong>Công thức giải thích:</Text>
                         <ul className="list-disc pl-5 mt-2 text-gray-600">
                             <li>
                                Diện tích (m2) = {values.totalAreaM2.toLocaleString('vi-VN')} m2
                             </li>
                             <li>Quy đổi diện tích về Hecta: {(values.totalAreaM2 / 10000).toLocaleString('vi-VN', { maximumFractionDigits: 4 })} ha</li>
                             <li>Lấy liều lượng khuyến cáo (trên 1 ha) nhân với diện tích (ha).</li>
                             <li>Kết quả: <b>{result.display}</b></li>
                         </ul>
                     </div>
                 )}
              </div>
           </Card>
        </Col>
      </Row>
  )
}

const RatioCalculator: React.FC = () => {
    const [form] = Form.useForm()
    
    // Default values
    const [values, setValues] = useState({
      chemAmount: 0,
      chemUnit: 'ml',
      targetAmount: 0, // e.g. 10 kg
      targetUnit: 'kg',
      
      actualAmount: 0, // e.g. 400 kg
    })

    const [result, setResult] = useState<{
        amount: number
        unit: string
        display: string
    } | null>(null)

    const handleValuesChange = (_: any, allValues: any) => {
        setValues({ ...values, ...allValues })
        calculate(allValues)
    }

    const calculate = (vals: typeof values) => {
        const { chemAmount, targetAmount, actualAmount, chemUnit } = vals
        
        if (!chemAmount || !targetAmount || !actualAmount) {
            setResult(null)
            return
        }

        // Formula: (Standard Chem / Standard Target) * Actual Target
        const resultAmount = (Number(chemAmount) / Number(targetAmount)) * Number(actualAmount)
        
        let displayAmount = resultAmount
        let displayUnit = chemUnit

        // Auto convert if result is too large/small (optional, keep simple for now)
        if (chemUnit === 'ml' && resultAmount >= 1000) {
            displayAmount = resultAmount / 1000
            displayUnit = 'Lít'
        } else if (chemUnit === 'l' && resultAmount < 1) {
             displayAmount = resultAmount * 1000
             displayUnit = 'ml'
        }

        setResult({
            amount: displayAmount,
            unit: displayUnit,
            display: `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(displayAmount)} ${displayUnit}`
        })
    }

    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={values}
                  onValuesChange={handleValuesChange}
                >
                    <Title level={5} className="mb-4">1. Tỷ lệ pha chuẩn (Theo hướng dẫn)</Title>
                    <Text type="secondary" className="mb-2 block">Ví dụ: Pha <b className="text-black">20ml</b> thuốc cho <b className="text-black">10kg</b> giống.</Text>
                    
                    <Row gutter={10}>
                        <Col span={12}>
                             <Form.Item label="Lượng thuốc" name="chemAmount">
                                 <NumberInput placeholder="VD: 20" size="large" />
                             </Form.Item>
                        </Col>
                        <Col span={12}>
                             <Form.Item label="Đơn vị thuốc" name="chemUnit">
                                 <Select size="large">
                                    <Option value="ml">ml</Option>
                                    <Option value="l">Lít</Option>
                                    <Option value="g">gram</Option>
                                    <Option value="kg">kg</Option>
                                 </Select>
                             </Form.Item>
                        </Col>
                    </Row>

                    <div className="flex justify-center items-center my-2">
                        <Text strong className="text-xl text-gray-400">DÙNG CHO</Text>
                    </div>

                    <Row gutter={10}>
                        <Col span={12}>
                             <Form.Item label="Lượng giống/nước" name="targetAmount">
                                 <NumberInput placeholder="VD: 10" size="large" />
                             </Form.Item>
                        </Col>
                        <Col span={12}>
                             <Form.Item label="Đơn vị" name="targetUnit">
                                 <Select size="large">
                                    <Option value="kg">kg (giống)</Option>
                                    <Option value="l">Lít (nước)</Option>
                                    <Option value="tan">Tấn</Option>
                                 </Select>
                             </Form.Item>
                        </Col>
                    </Row>

                    <Divider />

                    <Title level={5} className="mb-4">2. Thực tế áp dụng</Title>
                    <Form.Item label={`Tổng lượng ${values.targetUnit === 'l' ? 'nước' : 'giống'} cần xử lý`} name="actualAmount">
                        <NumberInput placeholder="VD: 400" size="large" addonAfter={values.targetUnit} />
                    </Form.Item>
                </Form>
            </Col>

            <Col xs={24} md={12}>
                <Card 
                  className="shadow-md h-full bg-blue-50" 
                  bordered={false}
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                   <div className="text-center">
                      <Title level={4} type="secondary">KẾT QUẢ TÍNH TOÁN</Title>
                      
                      <div className="my-8">
                         {result ? (
                             <>
                                 <Text className="block text-gray-500 mb-2">
                                     Để xử lý <b className="text-gray-800">{values.actualAmount} {values.targetUnit}</b> giống/nước, bạn cần lượng thuốc là:
                                 </Text>
                                 <Statistic 
                                     value={result.amount} 
                                     precision={2}
                                     suffix={<span className="text-2xl font-bold ml-1">{result.unit}</span>}
                                     valueStyle={{ color: '#1890ff', fontSize: '3rem', fontWeight: 'bold' }}
                                 />
                             </>
                         ) : (
                             <div className="text-gray-400 py-10">
                                 <ExperimentOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                                 <p>Nhập đủ thông tin bên trái để tính toán</p>
                             </div>
                         )}
                      </div>

                      {result && (
                          <div className="bg-white p-4 rounded-lg border border-blue-100 text-left">
                              <Text strong>Giải thích:</Text>
                              <ul className="list-disc pl-5 mt-2 text-gray-600">
                                  <li>Tỷ lệ: {values.chemAmount} {values.chemUnit} / {values.targetAmount} {values.targetUnit}</li>
                                  <li>
                                    Công thức: ({values.chemAmount} / {values.targetAmount}) x {values.actualAmount}
                                  </li>
                                  <li>Kết quả: <b>{result.display}</b></li>
                              </ul>
                          </div>
                      )}
                   </div>
                </Card>
            </Col>
        </Row>
    )
}

export default DosageCalculator
