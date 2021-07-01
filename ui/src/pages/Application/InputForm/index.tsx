import { addApplication, addApplicationYaml } from '@/services/kubevela/applicationapi';
import { listComponentDefinitions, listTraitDefinitions } from '@/services/kubevela/clusterapi';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import { Button, Card, Form, Input, message, Space } from 'antd';
import ProForm, {
  DrawerForm,
} from '@ant-design/pro-form';
import MonacoEditor from 'react-monaco-editor';
// import 'antd/dist/antd.css';
import { useEffect, useState } from 'react';
import { history } from 'umi';
import ComponentForm from './components/ComponentForm';

const options = {
  selectOnLineNumbers: true,
};

export default (props: any) => {
  // @ts-ignore
  const clusterName: string = props.location?.state?.cluster ?? '';

  const [components, setComponents] = useState<API.ComponentType[]>([]);

  const [compDefs, setCompDefs] = useState<API.CapabilityType[]>([]);
  const [traitDefs, setTraitDefs] = useState<API.CapabilityType[]>([]);

  const [drawerVisit, setDrawerVisit] = useState(false);

  const [code,setCode] = useState("")

  useEffect(() => {
    listComponentDefinitions(clusterName).then((resp) => {
      setCompDefs(resp.definitions);
    });
    listTraitDefinitions(clusterName).then((resp) => {
      setTraitDefs(resp.definitions);
    });
  }, []);

  console.log(compDefs, traitDefs)

  const saveApp = async (record: API.ApplicationType) => {
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

  const saveYaml = async (yaml: string) => {
    const hide = message.loading('正在添加');
    try {
      await addApplicationYaml(clusterName, yaml);
      hide();
      message.success('添加成功，即将刷新');
      history.push('/applications');
    } catch (error) {
      hide();
      message.error('添加失败，请重试');
    }
  }

  function onChangeHandle(newValue: string) {
    setCode(newValue)
  }

  return (
    <PageContainer>
      <Form
        labelCol={{ span: 4 }}
        onFinish={(values) => {
          saveApp({ ...values, components });
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            onClick={() => {
              setDrawerVisit(true);
            }}
          >
            Yaml
          </Button>
          <DrawerForm
            onVisibleChange={setDrawerVisit}
            title="Application"
            visible={drawerVisit}
            onFinish={async () => {
              saveYaml(code);
            }}
          >
            <MonacoEditor
              language="yaml"
              theme="vs-dark"
              value={code}
              options={options}
              onChange={onChangeHandle}
            />
            <FooterToolbar>
              <Button icon={<CloseOutlined />} onClick={() => setDrawerVisit(false)}>
                Cancel
              </Button>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                Save
              </Button>
            </FooterToolbar>
          </DrawerForm>
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
