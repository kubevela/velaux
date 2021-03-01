// prevent Ant design style from being overridden
import 'antd/dist/antd.css';

import React, { useEffect, useState } from 'react';

import { Button, Card, Form, message, Select, Space } from 'antd';
import { history, useModel } from 'umi';

import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';

import ServiceForm from './components/ServiceForm';
import { ProFormRadio, ProFormSelect, ProFormText } from '@ant-design/pro-form';

export default (): React.ReactNode => {
  const [components, setComponents] = useState<API.ComponentType[]>({});

  const [environments, setEnvironments] = useState<API.EnvironmentType[]>([]);
  const [caps, setCaps] = useState<API.CapabilityType[]>([]);

  const { addApplication } = useModel('useApplications');
  const { listEnvironments, listCapabilities } = useModel('useEnvironments');

  useEffect(() => {
    listEnvironments().then((r) => setEnvironments(r));
  }, [environments]);

  const saveApp = async (app: API.ApplicationType) => {
    const hide = message.loading('正在添加');
    try {
      await addApplication(app);
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
          saveApp({ ...values, components: components });
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card title="Basic">
            <ProFormText
              width="md"
              name="name"
              label="Application Name"
              rules={[{ required: true, max: 200 }]}
            />
            <ProFormText width="md" name="desc" label="Description" placeholder="请输入名称" />

            <Form.Item name="env" label="Choose environment" required>
              <Select
                onSelect={(e) => {
                  const env = e.toString();
                  listCapabilities(env).then((r) => setCaps(r));
                }}
                placeholder={'Select an environment'}
                optionLabelProp="value"
                style={{ width: '' }}
              >
                {environments.map((item) => (
                  <Select.Option key={item.name} value={item.name}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Card>

          <Card title="Components">
            <ServiceForm
              onChange={(value) => {
                let compList: API.ComponentType[] = [];
                value.forEach((service) => {
                  const { name, type, data, traits } = service;
                  if (name == null || type == null) {
                    return;
                  }
                  let comp: API.ComponentType = { name, type };

                  if (data != null) {
                    comp.settings = data;
                  }
                  if (traits != null) {
                    let ts: API.TraitType[] = [];

                    Object.keys(traits).forEach((k) => {
                      const t = {
                        name: k,
                        properties: traits[k],
                      };
                      ts.push(t);
                    });

                    comp.traits = ts;
                  }
                  compList.push(comp);
                });
                setComponents(compList);
              }}
              caps={caps}
            />
          </Card>
          <Card title="Release">
            <ProFormSelect
              label="Releasse strategy"
              name="releaseStrategy"
              initialValue="1"
              options={[
                {
                  value: '1',
                  label: 'Regular',
                },
                { value: '2', label: 'Canary' },
              ]}
            />
            <ProFormRadio.Group
              name="approvalGate"
              label="Approval Gate"
              options={[
                {
                  label: 'Yes',
                  value: '1',
                },
                {
                  label: 'No',
                  value: '2',
                },
              ]}
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
