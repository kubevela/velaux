import { addApplication } from '@/services/kubevela/applicationapi';
import { listComponentDefinitions, listTraitDefinitions } from '@/services/kubevela/clusterapi';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import { Button, Card, Form, Input, message, Space } from 'antd';
// import 'antd/dist/antd.css';
import { useEffect, useState } from 'react';
import { history } from 'umi';
import ComponentForm from './components/ComponentForm';
import { vela } from '@/services/kubevela/application_pb'

export default (props: any) => {
  // @ts-ignore
  const clusterName: string = props.location?.state?.cluster ?? '';

  const [components, setComponents] = useState<API.ComponentType[]>([]);

  const [compDefs, setCompDefs] = useState<API.CapabilityType[]>([]);
  const [traitDefs, setTraitDefs] = useState<API.CapabilityType[]>([]);

  useEffect(() => {
    listComponentDefinitions(clusterName).then((resp) => {
      setCompDefs(resp.definitions);
    });
    listTraitDefinitions(clusterName).then((resp) => {
      setTraitDefs(resp.definitions);
    });
  }, []);

  console.log(compDefs, traitDefs)

  const saveApp = async (record: vela.api.model.Application) => {
    const hide = message.loading('正在添加');
    try {
      await addApplication(clusterName, record);
      hide();
      message.success('添加成功，即将刷新');
      history.push('/applications');
    } catch (error) {
      hide();
      message.error('添加失败，请重试');
    }
  };

  return (
    <PageContainer>
      <Form
        labelCol={{ span: 4 }}
        onFinish={(values) => {
          saveApp({ ...values, components });
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card title="Basic">
            <Form.Item
              label="Application Name"
              name="name"
              rules={[{ required: true, message: 'Please input name!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Description" name="desc">
              <Input />
            </Form.Item>
          </Card>

          <Card title="Components">
            <ComponentForm
              onChange={(comps) => {
                setComponents(comps);
              }}
              compDefs={compDefs}
              traitDefs={traitDefs}
            />
          </Card>
        </Space>

        <FooterToolbar>
          <Button icon={<CloseOutlined />} onClick={() => history.push('/applications')}>
            Cancel
          </Button>
          <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
            Save
          </Button>
        </FooterToolbar>
      </Form>
    </PageContainer>
  );
};
