import React from 'react';
import ProForm, { ProFormText, ModalForm } from '@ant-design/pro-form';
import { useIntl } from 'umi';
import { Form, Input, Button, Space, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

export type FormTitleType = {
  id?: string;
  defaultMessage?: string;
};

export type UpdateFormProps = {
  title: FormTitleType;
  visible: boolean;
  onFinish: any;
  onVisibleChange: (visible: boolean) => void;
  initialValues?: API.EnvironmentType;
};

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();

  return (
    <ModalForm
      title={intl.formatMessage({
        id: props.title.id,
        defaultMessage: props.title.defaultMessage,
      })}
      visible={props.visible}
      onFinish={props.onFinish}
      onVisibleChange={props.onVisibleChange}
    >
      <ProForm.Group>
        <ProFormText
          width="md"
          name="name"
          label="Name"
          tooltip="最长为 24 位"
          placeholder="请输入名称"
          initialValue={props.initialValues?.name}
        />
        <ProFormText
          width="md"
          name="desc"
          label="Description"
          placeholder="请输入名称"
          initialValue={props.initialValues?.desc}
        />
      </ProForm.Group>

      <Form.List name="config" initialValue={props.initialValues?.config}>
        {(fields, { add, remove }) => (
          <>
            <Divider orientation="left" plain>
              Config
            </Divider>
            {fields.map((field) => (
              <Space key={field.name} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...field}
                  name={[field.name, 'name']}
                  fieldKey={[field.fieldKey, 'name']}
                  rules={[{ required: true, message: 'Missing name' }]}
                >
                  <Input placeholder="Name" />
                </Form.Item>
                <Form.Item
                  {...field}
                  name={[field.name, 'value']}
                  fieldKey={[field.fieldKey, 'value']}
                  rules={[{ required: true, message: 'Missing value' }]}
                >
                  <Input placeholder="Value" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(field.name)} />
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add config
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </ModalForm>
  );
};

export default UpdateForm;
