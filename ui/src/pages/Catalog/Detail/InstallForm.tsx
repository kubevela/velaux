import ProForm, {ModalForm, ProFormText} from '@ant-design/pro-form';

export type InstallFormProps = {
  visible: boolean;
  onFinish: any;
  onVisibleChange: (visible: boolean) => void;
  capability: API.CatalogCapabilityType;
  clusterName?: string;
};

export default (props: InstallFormProps) => {
  return (
    <ModalForm
      title='Install Capability to Cluster'
      visible={props.visible}
      onFinish={props.onFinish}
      onVisibleChange={props.onVisibleChange}
      modalProps={{okText: 'Install'}}
    >
      <ProForm.Group>
        <ProFormText
          width="md"
          name="capability"
          label="Capability"
          disabled
          initialValue={props.capability.name}
        />

        <ProFormText
          width="md"
          name="clusterName"
          label="Cluster Name"
          initialValue={props.clusterName}
        />
      </ProForm.Group>
    </ModalForm>
  );
};
