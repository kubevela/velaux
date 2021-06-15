import { updateApplication } from '@/services/kubevela/applicationapi';
import { Button, Drawer, Input, message } from 'antd';
import { useState } from 'react';
import { vela } from '@/services/kubevela/application_pb'
interface IProps {
  app: vela.api.model.Application;
  cluster: string;
  onUpdate: () => void;
}

export default (props: IProps) => {
  const [appDrawerVisible, setAppDrawerVisible] = useState<boolean>(false);
  const [data, setData] = useState<vela.api.model.Application>(props.app);

  const handleSubmit = async () => {
    const hide = message.loading('Updating');
    await updateApplication(props.cluster, data);
    hide();
    message.success('Updated application successfully!');
    closeAppDrawer();
    props.onUpdate();
  };

  const showAppDrawer = () => {
    setAppDrawerVisible(true);
  };

  const closeAppDrawer = () => {
    setAppDrawerVisible(false);
  };

  return (
    <>
      <Button id="edit" type="primary" onClick={showAppDrawer}>
        Edit
      </Button>
      <Drawer
        title="Application Data"
        placement="right"
        closable={false}
        onClose={closeAppDrawer}
        visible={appDrawerVisible}
        width={720}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div
            style={{
              textAlign: 'right',
            }}
          >
            <Button onClick={closeAppDrawer} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} type="primary">
              Submit
            </Button>
          </div>
        }
      >
        <Input.TextArea
          style={{
            width: '100%',
            height: '100%',
            resize: 'none',
          }}
          defaultValue={JSON.stringify(data, null, 2)}
          onChange={(e) => {
            setData(JSON.parse(e.target.value));
          }}
        />
      </Drawer>
    </>
  );
};
