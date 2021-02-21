import React from 'react';
import ProForm, { ProFormText, ModalForm } from '@ant-design/pro-form';
import { useIntl } from 'umi';
import { Form, Input, Button, Space, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';

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
          rules={[{ required: true, message: 'Missing name' }]}
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
              <UnorderedListOutlined /> Config
            </Divider>
            {fields.map((field) => (
              <ProForm.Group>
                <Space
                  key={field.key}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...field}
                    label="name"
                    name={[field.name, 'name']}
                    fieldKey={[field.fieldKey, 'name']}
                    rules={[{ required: true, message: 'Missing name' }]}
                  >
                    <Input placeholder="Name" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label="value"
                    name={[field.name, 'value']}
                    fieldKey={[field.fieldKey, 'value']}
                  >
                    <Input placeholder="Value" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              </ProForm.Group>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add config
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.List name="clusters" initialValue={props.initialValues?.clusters}>
        {(fields, { add, remove }) => (
          <>
            <Divider orientation="left" plain>
              <UnorderedListOutlined /> Clusters
            </Divider>
            {fields.map((field) => (
              <ProForm.Group>
                <Space
                  key={field.key}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...field}
                    label="name"
                    name={[field.name, 'name']}
                    fieldKey={[field.fieldKey, 'name']}
                    rules={[{ required: true, message: 'Missing name' }]}
                  >
                    <Input placeholder="Name" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              </ProForm.Group>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add clusters
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.List name="packages" initialValue={props.initialValues?.packages}>
        {(fields, { add, remove }) => (
          <>
            <Divider orientation="left" plain>
              <UnorderedListOutlined /> Packages
            </Divider>
            {fields.map((field) => (
              <ProForm.Group>
                <Space
                  key={field.key}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...field}
                    label="catalog"
                    name={[field.name, 'catalog']}
                    fieldKey={[field.fieldKey, 'catalog']}
                    rules={[{ required: true, message: 'Missing catalog' }]}
                  >
                    <Input placeholder="catalog" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label="package"
                    name={[field.name, 'package']}
                    fieldKey={[field.fieldKey, 'package']}
                    rules={[{ required: true, message: 'Missing package' }]}
                  >
                    <Input placeholder="package" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label="version"
                    name={[field.name, 'version']}
                    fieldKey={[field.fieldKey, 'version']}
                    tooltip="If no version is given, the latest version will be used"
                  >
                    <Input placeholder="version" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              </ProForm.Group>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add packages
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </ModalForm>
  );
};

export default UpdateForm;
