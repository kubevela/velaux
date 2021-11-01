import React from 'react';
import { Button, Message, Grid, Dialog, Form, Input, Upload, Field, Icon } from '@b-design/ui';
import { addCluster, editCluster, addClustDialog, UPLOADYMALFILE } from '../../../../constants';
import DefinitionCode from '../../../../components/DefinitionCode';
import defineTheme from '../../../../components/DefinitionCode/theme';
import { checkName } from '../../../../utils/common';
import { getClusterDetails } from '../../../../api/cluster';
import './index.less';
import Translation from '../../../../components/Translation';
const { Col, Row } = Grid;

type Props = {
  editClusterName: string;
  visible: boolean;
  page?: number;
  pageSize?: number;
  query?: string;
  onOK: () => void;
  onClose: () => void;
  dispatch: ({}) => {};
};

type State = {
  editMode: boolean;
  cluster: {};
};

class AddClustDialog extends React.Component<Props, State> {
  field: Field;
  DefinitionCodeRef: React.RefObject<DefinitionCode>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.DefinitionCodeRef = React.createRef();
    this.state = {
      editMode: props.editClusterName !== '',
      cluster: {},
    };
  }

  componentDidMount() {
    this.loadClusterDetail();
  }

  loadClusterDetail = () => {
    const { editClusterName } = this.props;
    if (editClusterName) {
      getClusterDetails({ clusterName: editClusterName }).then((re) => {
        console.log(re);
      });
    }
  };

  onClose = () => {
    this.props.onClose();
    this.resetField();
  };

  onOk = () => {
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.props.dispatch({
        type: 'clusters/createCluster',
        payload: values,
        callback: () => {
          Message.success(<Translation>cluster add success</Translation>);
          this.resetField();
          this.props.onOK();
        },
      });
    });
  };

  resetField() {
    this.field.setValues({
      name: '',
      description: '',
      dashboardURL: '',
      kubeConfig: '',
    });
  }

  onError = (r: {}) => {};

  customRequest = (option: any) => {
    let reader = new FileReader();
    let fileselect = option.file;
    reader.readAsText(fileselect);
    reader.onload = () => {
      this.field.setValues({
        kubeConfig: reader.result?.toString() || '',
      });
    };
    return {
      file: File,
      onError: this.onError,
      abort() {},
    };
  };

  render() {
    const { visible } = this.props;
    const { editMode } = this.state;
    const {
      name,
      alias,
      describe,
      namePlaceHold,
      aliasPlaceHold,
      describePlaceHold,
      kubeAPI,
      dashboardURL,
      dashboarPlaceHold,
    } = addClustDialog;
    const FormItem = Form.Item;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 18,
      },
    };
    const init = this.field.init;
    const values: { kubeConfig: string } = this.field.getValues();
    const valueInfo = values.kubeConfig || '';
    return (
      <div>
        <Dialog
          className="dialog-clust-wraper"
          title={editMode ? editCluster : addCluster}
          autoFocus={true}
          visible={visible}
          onOk={this.onOk}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={['ok', 'cancel']}
          footerAlign="center"
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={name} required>
                  <Input
                    htmlType="name"
                    name="name"
                    disabled={editMode}
                    placeholder={namePlaceHold}
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          pattern: checkName,
                          message: 'Please enter a valid English name',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={alias}>
                  <Input
                    name="alias"
                    placeholder={aliasPlaceHold}
                    {...init('alias', {
                      rules: [
                        {
                          minLength: 2,
                          maxLength: 64,
                          message: 'Enter a string of 2 to 64 characters.',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={describe}>
                  <Input
                    htmlType="describe"
                    name="describe"
                    placeholder={describePlaceHold}
                    {...init('description')}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={dashboardURL}>
                  <Input
                    htmlType="dashboardURL"
                    name="dashboardURL"
                    placeholder={dashboarPlaceHold}
                    {...init('dashboardURL', {
                      rules: [
                        {
                          required: false,
                          format: 'url',
                          message: 'Input according to URL specification',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem label={kubeAPI} labelAlign="top">
                  <Upload request={this.customRequest}>
                    <Button text type="normal" className="padding-left-0">
                      <Icon type="cloudupload" />
                      {UPLOADYMALFILE}
                    </Button>
                  </Upload>

                  <div id="guide-code" className="guide-code">
                    <DefinitionCode
                      containerId="guide-code"
                      language={'yaml'}
                      readOnly={false}
                      defineTheme={defineTheme}
                      {...init('kubeConfig')}
                      value={valueInfo}
                      ref={this.DefinitionCodeRef}
                    />
                  </div>
                </FormItem>
              </Col>
            </Row>
          </Form>
        </Dialog>
      </div>
    );
  }
}

export default AddClustDialog;
