import React, { useMemo, useState } from "react"
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import {
  CalculatorOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons"
import ComboBox from "@/components/common/combo-box"
import { useProductSearch } from "@/queries/product"
import type { Product } from "@/models/product.model"

const { Title, Text } = Typography

type NutrientKey = "n" | "p" | "k"

type Ingredient = {
  id: string
  productId?: number
  productCode?: string
  unitName?: string
  name: string
  availableKg: number
  n: number
  p: number
  k: number
}

type TargetNutrients = Record<NutrientKey, number | null>

type MixtureResult = {
  type: "exact" | "approximate"
  quantities: Record<string, number>
  actual: Record<NutrientKey, number>
  errors: Record<NutrientKey, number>
  message: string
}

const nutrientLabels: Record<NutrientKey, string> = {
  n: "Đạm",
  p: "Lân",
  k: "Kali",
}

const FERTILIZER_PRODUCT_TYPE_ID = 5

const defaultIngredients: Ingredient[] = [
  {
    id: "ingredient-1",
    name: "",
    availableKg: 0,
    n: 0,
    p: 0,
    k: 0,
  },
  {
    id: "ingredient-2",
    name: "",
    availableKg: 0,
    n: 0,
    p: 0,
    k: 0,
  },
]

const formatKg = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value)} kg`

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value)}%`

const getAvailableKg = (ingredient: Ingredient) =>
  Math.max(0, Number(ingredient.availableKg || 0))

const getActiveNutrients = (target: TargetNutrients) =>
  (Object.keys(target) as NutrientKey[]).filter((key) => {
    const value = target[key]
    return value !== null && value !== undefined && Number.isFinite(value)
  })

const calculateActual = (
  ingredients: Ingredient[],
  quantities: Record<string, number>,
  totalWeight: number,
) => {
  const actual = { n: 0, p: 0, k: 0 }

  ingredients.forEach((ingredient) => {
    const quantity = quantities[ingredient.id] || 0
    actual.n += (quantity * ingredient.n) / totalWeight
    actual.p += (quantity * ingredient.p) / totalWeight
    actual.k += (quantity * ingredient.k) / totalWeight
  })

  return actual
}

const calculateMixture = (
  ingredients: Ingredient[],
  totalWeight: number,
  target: TargetNutrients,
): MixtureResult | null => {
  const activeNutrients = getActiveNutrients(target)
  const selectedIngredients = ingredients.filter((ingredient) => getAvailableKg(ingredient) > 0)
  const selectedTotal = selectedIngredients.reduce(
    (sum, ingredient) => sum + getAvailableKg(ingredient),
    0,
  )

  if (selectedTotal <= 0) {
    return null
  }

  const quantities = Object.fromEntries(
    ingredients.map((ingredient) => [ingredient.id, getAvailableKg(ingredient)]),
  )
  const actual = calculateActual(ingredients, quantities, selectedTotal)
  const errors = Object.fromEntries(
    (Object.keys(actual) as NutrientKey[]).map((nutrient) => [
      nutrient,
      target[nutrient] === null ? 0 : actual[nutrient] - (target[nutrient] || 0),
    ]),
  ) as Record<NutrientKey, number>
  const isWithinTarget =
    activeNutrients.length === 0 ||
    activeNutrients.every((nutrient) => Math.abs(errors[nutrient]) <= 0.05)

  return {
    type: isWithinTarget ? "exact" : "approximate",
    quantities,
    actual,
    errors,
    message:
      activeNutrients.length === 0
        ? "Tỷ lệ thực tế được tính từ số kg phân đã chọn."
        : isWithinTarget
          ? "Tỷ lệ thực tế đạt mục tiêu đã nhập."
          : "Tỷ lệ thực tế chưa đạt mục tiêu đã nhập.",
  }
}

const FertilizerCalculator: React.FC = () => {
  const [totalWeight, setTotalWeight] = useState(200)
  const [target, setTarget] = useState<TargetNutrients>({ n: 15, p: null, k: 20 })
  const [ingredients, setIngredients] = useState<Ingredient[]>(defaultIngredients)
  const [productSearchTerm, setProductSearchTerm] = useState("")

  const {
    data: fertilizerProductsData,
    isLoading: isLoadingFertilizerProducts,
    isFetching: isFetchingFertilizerProducts,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProductSearch(
    productSearchTerm,
    20,
    true,
    { type_id: FERTILIZER_PRODUCT_TYPE_ID },
  )
  const fertilizerProductOptions = useMemo(() => {
    return (
      fertilizerProductsData?.pages.flatMap((page) =>
        page.data.map((product: Product & { label?: string; value?: number }) => ({
          ...product,
          label: product.label || product.trade_name || product.name,
          value: product.value || product.id,
          unit_name: product.unit?.name || product.unit_name,
        })),
      ) || []
    )
  }, [fertilizerProductsData])

  const totalAvailable = useMemo(
    () => ingredients.reduce((sum, ingredient) => sum + getAvailableKg(ingredient), 0),
    [ingredients],
  )
  const result = useMemo(
    () => calculateMixture(ingredients, totalWeight, target),
    [ingredients, totalWeight, target],
  )

  const updateIngredient = (id: string, patch: Partial<Ingredient>) => {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...patch } : ingredient,
      ),
    )
  }

  const addIngredient = () => {
    setIngredients((current) => [
      ...current,
      {
        id: `ingredient-${Date.now()}`,
        name: "",
        availableKg: 0,
        n: 0,
        p: 0,
        k: 0,
      },
    ])
  }

  const removeIngredient = (id: string) => {
    setIngredients((current) => current.filter((ingredient) => ingredient.id !== id))
  }

  const selectProduct = (
    ingredientId: string,
    value: string | number | (string | number)[],
    option: any,
  ) => {
    if (!value || Array.isArray(value)) {
      updateIngredient(ingredientId, {
        productId: undefined,
        productCode: undefined,
        unitName: undefined,
        name: "",
      })
      return
    }

    const selectedProduct = Array.isArray(option) ? option[0] : option
    updateIngredient(ingredientId, {
      productId: Number(value),
      productCode: selectedProduct?.code,
      unitName: selectedProduct?.unit?.name || selectedProduct?.unit_name,
      name: String(selectedProduct?.label || selectedProduct?.trade_name || selectedProduct?.name || ""),
    })
  }

  const setTargetValue = (nutrient: NutrientKey, value: number | null) => {
    setTarget((current) => ({ ...current, [nutrient]: value }))
  }

  const ingredientColumns: ColumnsType<Ingredient> = [
    {
      title: "Tên phân",
      dataIndex: "name",
      width: 260,
      render: (_, record) => (
        <ComboBox
          noFormItem
          value={record.productId}
          data={fertilizerProductOptions}
          isLoading={isLoadingFertilizerProducts}
          isFetching={isFetchingFertilizerProducts}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          onSearch={setProductSearchTerm}
          onSelectionChange={(value, option) => selectProduct(record.id, value, option)}
          placeholder="Chọn sản phẩm phân bón"
          className="fertilizer-product-select"
          style={{ width: 260, maxWidth: "100%" }}
        />
      ),
    },
    {
      title: "Kg có sẵn",
      dataIndex: "availableKg",
      width: 130,
      align: "right",
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.availableKg}
          className="w-full"
          addonAfter="kg"
          onChange={(value) => updateIngredient(record.id, { availableKg: Number(value || 0) })}
        />
      ),
    },
    {
      title: "Đạm %",
      dataIndex: "n",
      width: 110,
      align: "right",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          value={record.n}
          className="w-full"
          onChange={(value) => updateIngredient(record.id, { n: Number(value || 0) })}
        />
      ),
    },
    {
      title: "Lân %",
      dataIndex: "p",
      width: 110,
      align: "right",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          value={record.p}
          className="w-full"
          onChange={(value) => updateIngredient(record.id, { p: Number(value || 0) })}
        />
      ),
    },
    {
      title: "Kali %",
      dataIndex: "k",
      width: 110,
      align: "right",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          value={record.k}
          className="w-full"
          onChange={(value) => updateIngredient(record.id, { k: Number(value || 0) })}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 64,
      align: "center",
      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          disabled={ingredients.length <= 1}
          onClick={() => removeIngredient(record.id)}
        />
      ),
    },
  ]

  const resultRows = ingredients
    .map((ingredient) => ({
      ...ingredient,
      quantity: result?.quantities[ingredient.id] || 0,
    }))
    .filter((ingredient) => ingredient.quantity > 0.005)

  return (
    <div className="p-2 md:p-6">
      <Space align="center" className="mb-4">
        <ExperimentOutlined className="text-emerald-600 text-2xl" />
        <Title level={4} className="!mb-0">
          Tính phối phân
        </Title>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} className="shadow-sm h-full">
            <Title level={5}>Mục tiêu</Title>
            <Row gutter={[12, 12]}>
              <Col span={24}>
                <Text strong>Số kg muốn trộn</Text>
                <InputNumber
                  min={0}
                  precision={2}
                  value={totalWeight}
                  className="w-full mt-2"
                  addonAfter="kg"
                  onChange={(value) => setTotalWeight(Number(value || 0))}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text strong>Đạm</Text>
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  value={target.n}
                  className="w-full mt-2"
                  addonAfter="%"
                  placeholder="Bỏ trống"
                  onChange={(value) => setTargetValue("n", value === null ? null : Number(value))}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text strong>Lân</Text>
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  value={target.p}
                  className="w-full mt-2"
                  addonAfter="%"
                  placeholder="Bỏ trống"
                  onChange={(value) => setTargetValue("p", value === null ? null : Number(value))}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Text strong>Kali</Text>
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  value={target.k}
                  className="w-full mt-2"
                  addonAfter="%"
                  placeholder="Bỏ trống"
                  onChange={(value) => setTargetValue("k", value === null ? null : Number(value))}
                />
              </Col>
              <Col span={24}>
                <Text type="secondary">
                  Mục tiêu chỉ dùng để so sánh, không làm thay đổi tỷ lệ thực tế. Ô bỏ trống chỉ hiển thị tỷ lệ sau khi phối.
                </Text>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Statistic title="Tổng kg đã chọn" value={totalAvailable} suffix="kg" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="Dư sau trộn" value={totalAvailable - totalWeight} suffix="kg" precision={2} />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            className="shadow-sm h-full"
            title="Thành phần bao phân"
            extra={
              <Space>
                <Tag color="green">Tổng {formatKg(totalAvailable)}</Tag>
                <Button icon={<ReloadOutlined />} onClick={() => setIngredients(defaultIngredients)}>
                  Làm mới
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={addIngredient}>
                  Thêm phân
                </Button>
              </Space>
            }
          >
            <Table
              rowKey="id"
              columns={ingredientColumns}
              dataSource={ingredients}
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: 820 }}
              size="middle"
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card bordered={false} className="shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <Title level={5} className="!mb-0">
                Kết quả
              </Title>
              {result && (
                <Tag color={result.type === "exact" ? "success" : "warning"}>
                  {result.type === "exact" ? "Đạt mục tiêu" : "Chưa đạt"}
                </Tag>
              )}
            </div>

            {!totalWeight || totalWeight <= 0 ? (
              <Alert type="info" showIcon message="Nhập số kg muốn trộn." />
            ) : !result ? (
              <Alert type="warning" showIcon message="Nhập số kg phân đã chọn để tính tỷ lệ thực tế." />
            ) : (
              <>
                <Alert
                  type={result.type === "exact" ? "success" : "warning"}
                  showIcon
                  message={result.message}
                />

                <Row gutter={[16, 16]} className="mt-4">
                  {(["n", "p", "k"] as NutrientKey[]).map((nutrient) => (
                    <Col xs={24} md={8} key={nutrient}>
                      <Statistic
                        title={`${nutrientLabels[nutrient]} thực tế`}
                        value={result.actual[nutrient]}
                        suffix="%"
                        precision={2}
                        valueStyle={{
                          color:
                            target[nutrient] !== null &&
                            Math.abs(result.errors[nutrient]) > 0.05
                              ? "#cf1322"
                              : undefined,
                        }}
                      />
                      {target[nutrient] !== null ? (
                        <Text type="secondary">
                          Mục tiêu {formatPercent(target[nutrient] || 0)}
                        </Text>
                      ) : (
                        <Text type="secondary">Không đặt mục tiêu</Text>
                      )}
                    </Col>
                  ))}
                </Row>

                <Divider />

                <Table
                  rowKey="id"
                  dataSource={resultRows}
                  pagination={false}
                  size="middle"
                  columns={[
                    {
                      title: "Loại phân",
                      dataIndex: "name",
                      render: (name: string, record: Ingredient & { quantity: number }) => (
                        <div>
                          <Text strong>{name}</Text>
                        </div>
                      ),
                    },
                    {
                      title: "Kg đã chọn",
                      dataIndex: "quantity",
                      align: "right" as const,
                      render: (quantity: number) => (
                        <Text strong className="text-emerald-700">
                          {formatKg(quantity)}
                        </Text>
                      ),
                    },
                  ]}
                />

                {result.type === "approximate" && (
                  <Alert
                    className="mt-4"
                    type="info"
                    showIcon
                    icon={<CalculatorOutlined />}
                    message="Mục tiêu chỉ dùng để so sánh. Muốn đổi tỷ lệ thực tế, hãy đổi kg hoặc thành phần của các loại phân đã chọn."
                  />
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default FertilizerCalculator
