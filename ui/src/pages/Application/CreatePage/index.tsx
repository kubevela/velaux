import React, { useState } from 'react';
import { StepsForm, ProFormText, ProFormSelect, ProFormRadio } from '@ant-design/pro-form';
import ProCard from '@ant-design/pro-card';
import { Button, Form, message } from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { useModel } from 'umi';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import { withTheme } from '@rjsf/core';
// @ts-ignore
import { Theme as AntDTheme } from '@rjsf/antd';
import 'antd/dist/antd.css';

const FormRender = withTheme(AntDTheme);

export type FormProps = {};

const CreateForm: React.FC<FormProps> = (props) => {
  const history = useHistory();

  const { addApplication } = useModel('useApplications');
  const { listEnvironments, listCapabilities } = useModel('useEnvironments');

  const [capsState, setCapsState] = useState<API.CapabilityType[]>();

  const [chosenCaps, setChosenCaps] = useState<API.CapabilityType[]>([]);

  const handleAdd = async (val: API.ApplicationType) => {
    const hide = message.loading('正在添加');
    try {
      await addApplication(val);
      hide();
      message.success('添加成功，即将刷新');
      return true;
    } catch (error) {
      hide();
      message.error('添加失败，请重试');
      return false;
    }
  };

  return (
    <PageContainer>
      <ProCard>
        <StepsForm<API.ApplicationType>
          onFinish={async (value) => {
            handleAdd(value as API.ApplicationType);
            history.push('/applications');
            message.success('提交成功');
          }}
          formProps={{
            validateMessages: {
              required: '此项为必填项',
            },
          }}
        >
          <StepsForm.StepForm<{
            name: string;
            desc: string;
            env: string;
          }>
            name="base"
            title="Basic info"
            onFinish={async (value) => {
              const caps = await listCapabilities(value.env);
              setCapsState(caps);
              return true;
            }}
          >
            <ProFormText
              width="md"
              name="name"
              label="Name"
              tooltip="最长为 24 位"
              placeholder="请输入名称"
              rules={[{ required: true }]}
            />
            <ProFormText width="md" name="desc" label="Description" placeholder="请输入名称" />
            <ProFormSelect
              width="md"
              name="env"
              label="Choose environment"
              request={async () => {
                const environments = await listEnvironments();
                let names: { value: string }[] = [];
                environments.forEach((val) => {
                  names.push({ value: val.name });
                });
                return names;
              }}
            />
          </StepsForm.StepForm>

          <StepsForm.StepForm
            name="cap-options"
            title="Capabilities"
            onFinish={async (value) => {
              return true;
            }}
          >
            <Form.List name="capabilities">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item>
                      <ProCard key={field.key} split="vertical">
                        <ProCard>
                          <ProFormSelect
                            width="sm"
                            request={async () => {
                              let names: { value: string }[] = [];
                              capsState?.forEach((val) => {
                                names.push({ value: val.name });
                              });
                              return names;
                            }}
                            name="capname"
                            label="Choose capability"
                            fieldProps={{
                              onChange: (capName) => {
                                capsState?.forEach((cap) => {
                                  if (cap.name === capName) {
                                    if (chosenCaps.length > index) {
                                      setChosenCaps(
                                        chosenCaps.map((val, i) => {
                                          if (i != index) {
                                            return val;
                                          } else {
                                            return cap;
                                          }
                                        }),
                                      );
                                    } else {
                                      setChosenCaps([...chosenCaps, cap]);
                                    }
                                  }
                                });
                              },
                            }}
                          />
                          <MinusCircleOutlined
                            onClick={() => {
                              setChosenCaps(chosenCaps.filter((_, i) => i != index));
                              remove(field.name);
                            }}
                          />
                        </ProCard>
                        <ProCard>
                          <div>
                            {(() => {
                              if (chosenCaps.length > index) {
                                const cap = chosenCaps[index];
                                const schema = JSON.parse(cap.jsonschema);
                                return (
                                  // add onChange listener to get values
                                  <FormRender name="capbody" schema={schema} children={true} />
                                );
                              }
                              return 'Please select an option';
                            })()}
                          </div>
                        </ProCard>
                      </ProCard>
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add capability
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </StepsForm.StepForm>

          <StepsForm.StepForm name="release" title="Release">
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
              name="approval"
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
          </StepsForm.StepForm>
        </StepsForm>
      </ProCard>
    </PageContainer>
  );
};

export default CreateForm;
