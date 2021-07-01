import { updateApplication } from '@/services/kubevela/applicationapi';
import { Button, Drawer, Input, message } from 'antd';
import { useState } from 'react';
import MonacoEditor from "react-monaco-editor";

interface IProps {
  app: API.ApplicationType;
  cluster: string;
  onUpdate: () => void;
}
const options = {
  selectOnLineNumbers: true,
};

export default (props: IProps) => {
  const [appDrawerVisible, setAppDrawerVisible] = useState<boolean>(false);
  const [data, setData] = useState<API.ApplicationType>(props.app);

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

  const onChangeHandle = (newDate: string) => {
    setData(JSON.parse(newDate))
  }
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
        <MonacoEditor
          language="json"
          theme="vs-dark"
          value={JSON.stringify(data, null, 2)}
          options={options}
          onChange={onChangeHandle}
        />
      </Drawer>
    </>
  );
};
