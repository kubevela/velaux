import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, List, message, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  listComponentDefinitions,
  listTraitDefinitions,
  isVelaInstalled,
  installVelaController,
} from '@/services/kubevela/clusterapi';
export default (props: any) => {
  // See routing parameters:
  // https://umijs.org/docs/routing#routing-component-parameters
  // @ts-ignore
  const clusterName = props.match.params.clusterName;

  const [velaInstalled, setVelaInstalled] = useState<boolean>(true);
  const [compDefs, setCompDefs] = useState<API.CapabilityType[]>([]);
  const [traitDefs, setTraitDefs] = useState<API.CapabilityType[]>([]);

  useEffect(() => {
    listComponentDefinitions(clusterName).then((resp) => {
      setCompDefs(resp.componentDefinitions);
    });
    listTraitDefinitions(clusterName).then((resp) => {
      setTraitDefs(resp.traitDefinitions);
    });
    isVelaInstalled(clusterName).then((resp) => setVelaInstalled(resp.installed));
  }, []);

  let velaInstalledText;
  if (velaInstalled) {
    velaInstalledText = <Typography.Text type="success">Yes</Typography.Text>;
  } else {
    velaInstalledText = <Typography.Text type="danger">No</Typography.Text>;
  }

  const installVela = async () => {
    const hide = message.loading('Installing Vela Helm Chart...');
    await installVelaController(clusterName, 'https://kubevelacharts.oss-accelerate.aliyuncs.com/core', '1.0.5');
    hide();
    message.success('Installed Vela Helm Chart successfully');
  };

  return (
    <PageContainer
      fixedHeader
      waterMarkProps={{ content: '' }} // disable watermark
      header={{
        title: <Typography.Title level={2}>{clusterName}</Typography.Title>,
        breadcrumb: {
          routes: [
            {
              path: '',
              breadcrumbName: 'Clusters',
            },
          ],
        },
      }}
    >
      <ProCard direction="column" ghost gutter={[16, 16]}>
        <ProCard colSpan={12}>
          <Typography.Title level={3}>KubeVela Controller</Typography.Title>
          <Typography.Text>Installed:</Typography.Text> {velaInstalledText}
          <Space style={{ float: 'right' }}>
            <Button type="primary" onClick={installVela}>
              Install KubeVela
            </Button>
          </Space>
        </ProCard>

        <ProCard gutter={16} ghost style={{ minHeight: 200 }}>
          <ProCard title="ComponentDefinition" colSpan={12}>
            <List
              dataSource={compDefs}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical">
                    <Typography.Title level={5}>{item.name}</Typography.Title>
                    <Typography.Text type="secondary"> {item.desc}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </ProCard>
          <ProCard title="TraitDefinition" colSpan={12}>
            <List
              dataSource={traitDefs}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical">
                    <Typography.Title level={5}>{item.name}</Typography.Title>
                    <Typography.Text type="secondary"> {item.desc}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </ProCard>
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};
