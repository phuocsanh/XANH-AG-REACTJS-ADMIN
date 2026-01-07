import React from 'react';
import { Card, Skeleton, Row, Col, Space, Tabs } from 'antd';

const { TabPane } = Tabs;

const InventoryReceiptDetailSkeleton: React.FC = () => {
  return (
    <div className="p-0 md:p-6 bg-gray-50 min-h-screen">
      {/* Header Skeleton */}
      <div className="m-2 md:m-0 mb-4 md:mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <Row justify="space-between" align="middle">
          <Col xs={24} md={12}>
            <Space size="middle" className="w-full">
              <Skeleton.Button active size="small" shape="circle" />
              <div className="flex-1">
                <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
              </div>
            </Space>
          </Col>
          <Col xs={24} md={12} className="text-right">
            <Space>
              <Skeleton.Button active size="default" />
              <Skeleton.Button active size="default" />
            </Space>
          </Col>
        </Row>
      </div>

      {/* Tabs & Content Skeleton */}
      <Card className="w-full shadow-sm border-none" bodyStyle={{ padding: 0 }}>
        <Tabs activeKey="1" size="large" className="bg-white px-2">
          <TabPane tab={<Skeleton.Input active size="small" style={{ width: 100 }} />} key="1">
            <div className="p-4 md:p-6">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <Card title={<Skeleton.Input active size="small" style={{ width: 150 }} />} size="small" className="bg-gray-50">
                    <Skeleton active paragraph={{ rows: 6 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title={<Skeleton.Input active size="small" style={{ width: 120 }} />} size="small" className="bg-gray-50">
                    <div className="flex flex-col items-center justify-center p-8">
                      <Skeleton.Avatar active size={100} shape="square" />
                      <Skeleton.Button active className="mt-4" />
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
          <TabPane tab={<Skeleton.Input active size="small" style={{ width: 80 }} />} key="2" />
          <TabPane tab={<Skeleton.Input active size="small" style={{ width: 80 }} />} key="3" />
        </Tabs>
      </Card>
    </div>
  );
};

export default InventoryReceiptDetailSkeleton;
