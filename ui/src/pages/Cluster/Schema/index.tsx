import ProCard from '@ant-design/pro-card';
import { PageContainer } from '@ant-design/pro-layout';
import { List, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import {
  getSchema,
} from '@/services/kubevela/clusterapi';

import ProDescriptions from '@ant-design/pro-descriptions';

export default (props: any) => {
  // See routing parameters:
  // https://umijs.org/docs/routing#routing-component-parameters
  // @ts-ignore
  const clusterName = props.match.params.clusterName;
  const [compDefs, setSchema] = useState<API.CapabilityType>();
  const schemaName = props.location.query.name;
  const schemaNamespace = props.location.query.namespace;
  const schemaType = props.location.query.type;

  useEffect(() => {
    getSchema(clusterName,schemaName, schemaNamespace,schemaType).then((resp) => {
      if(resp.definitions.length){
        setSchema(resp.definitions[0]);
      }
    });

  }, []);

  return (
    <PageContainer
      fixedHeader
      waterMarkProps={{ content: '' }} // disable watermark
      header={{
        title: <Typography.Title level={2}>{schemaName}</Typography.Title>,
        breadcrumb: {
          routes: [
            {
              path: '',
              breadcrumbName: 'JsonSchema',
            },
          ],
        },
      }}
    >
      <ProCard direction="column" ghost gutter={[16, 16]}>

        <ProCard gutter={16} ghost style={{ minHeight: 200 }}>

            <ProDescriptions
              title="Definition JsonSchema"
              dataSource={compDefs}
              columns={[
                {
                  title: 'Name',
                  key: 'name',
                  dataIndex: 'name',
                },
                {
                  title: 'Namespace',
                  key: 'namespace',
                  dataIndex: 'namespace',
                },
                {
                  title: 'Description',
                  key: 'desc',
                  dataIndex: 'desc',
                },
                {
                  title: 'JsonSchema',
                  valueType: "jsonCode",
                  key: 'jsonschema',
                  dataIndex: 'jsonschema',
                },
              ]}
            >
            </ProDescriptions>

          </ProCard>
        </ProCard>
    </PageContainer>
  );
};
