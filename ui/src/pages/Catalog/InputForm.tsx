import ProForm, {ModalForm, ProFormText} from '@ant-design/pro-form';

export type InputFormProps = {
  title: string;
  visible: boolean;
  onFinish: any;
  onVisibleChange: (visible: boolean) => void;
  initialValues?: API.CatalogType;
};

export default (props: InputFormProps) => {
  return (
    <ModalForm
      title={props.title}
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
          initialValue={props.initialValues?.name}
        />

        <ProFormText
          width="md"
          name="desc"
          label="Description"
          initialValue={props.initialValues?.desc}
        />

        <ProFormText
          width="md"
          name="type"
          label="type"
          initialValue={props.initialValues?.type}
        />

        <ProFormText
          width="md"
          name="url"
          label="url"
          initialValue={props.initialValues?.url}
        />

        <ProFormText
          width="md"
          name="token"
          label="token"
          initialValue={props.initialValues?.token}
        />

      </ProForm.Group>
    </ModalForm>
  );
};
