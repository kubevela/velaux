import ProCard from '@ant-design/pro-card';
import {PageContainer} from '@ant-design/pro-layout';
import {Button, Col, message, Row, Space, Typography} from 'antd';
import {useEffect, useState} from "react";
import {getCatalog, installCapability, listCapabilities, syncCatalog} from "@/services/kubevela/catalogapi";
import CapabilityDetail from "@/pages/Catalog/Detail/CapabilityDetail";
import InstallForm from "@/pages/Catalog/Detail/InstallForm";
import {InfoCircleOutlined, PlusOutlined} from "@ant-design/icons";

export default (props: any) => {
  const {catalogName} = props.match.params;

  const [catalog, setCatalog] = useState<API.CatalogType>();
  const [capabilities, setCapabilities] = useState<API.CatalogCapabilityType[]>([]);
  const [detailVisible, setDetailVisible] = useState<number>(-1);
  const [installVisible, setInstallVisible] = useState<number>(-1);

  useEffect(() => {
    getCatalog(catalogName).then((resp) => {
      setCatalog(resp.catalog);
    });

    listCapabilities(catalogName).then((resp) => {
      setCapabilities(resp.capabilities);
    });
  }, []);

  const doSyncCatalog = async () => {
    const hide = message.loading('Syncing catalog...');
    await syncCatalog(catalogName);
    hide();
    message.success('Catalog sync successfully');
  };


  const doInstallCapability = async (capabilityName: string) => {
    const hide = message.loading('Installing capability...');
    const success = await installCapability(capabilityName);
    hide();
    message.success('Capability install successfully');
    return success
  };

  return (
    <PageContainer
      fixedHeader
      waterMarkProps={{content: ''}} // disable watermark
      header={{
        title: <Typography.Title level={2}>{catalog?.name}</Typography.Title>,
        breadcrumb: {
          routes: [
            {
              path: '',
              breadcrumbName: 'Catalogs',
            },
          ],
        },
      }}
    >
      <ProCard direction="column" ghost gutter={[4, 4]}>
        <Space style={{display: 'block', height: '3rem'}}>
          <Space style={{float: 'right'}}>
            <Button type="primary" onClick={doSyncCatalog}>
              Sync
            </Button>
          </Space>
        </Space>

        <Row>
          {capabilities.map((item, i) => <Col
              span={8} style={{padding: '.5rem'}}>
              <Space direction="vertical"
                     style={{padding: '.5rem', width: '100%', borderRadius: '.25rem', boxShadow: '0 1px 4px 0 rgb(0 0 0 / 14%)'}}>
                <Typography.Title level={5}>{item.name}</Typography.Title>
                <Typography.Text type="secondary">Type: {item.type}</Typography.Text>
                <Typography.Text type="secondary">Desc: {item.desc}</Typography.Text>
                <Space>
                  <Button
                    type="primary"
                    key="primary"
                    size="small"
                    onClick={() => {
                      setDetailVisible(i);
                    }}
                  ><InfoCircleOutlined /></Button>
                  <Button
                    type="primary"
                    key="primary"
                    size="small"
                    onClick={() => {
                      setInstallVisible(i);
                    }}
                  ><PlusOutlined /></Button>
                </Space>
              </Space>
              <CapabilityDetail
                visible={detailVisible === i}
                onVisibleChange={async (visible) => {
                  if (!visible) {
                    setDetailVisible(-1);
                  }
                }}
                capability={item}
              />
              <InstallForm
                visible={installVisible === i}
                onFinish={async (value: any) => {
                  const success = await doInstallCapability(value as string);
                  if (success) {
                    setInstallVisible(-1);
                  }
                  return true;
                }}
                onVisibleChange={async (visible) => {
                  if (!visible) {
                    setInstallVisible(-1);
                  }
                }}
                capability={item}
              />
            </Col>
          )}
        </Row>
      </ProCard>
    </PageContainer>
  );
};
