import React from 'react';
import {
  Button,
  Message,
  Grid,
  Dialog,
  Form,
  Input,
  Upload,
  Field,
  Icon,
  Loading,
} from '@b-design/ui';
import { addCluster, editCluster, addClustDialog, UPLOADYMALFILE } from '../../../../constants';
import DefinitionCode from '../../../../components/DefinitionCode';
import { checkName } from '../../../../utils/common';
import { getClusterDetails, updateCluster } from '../../../../api/cluster';
import './index.less';
import Translation from '../../../../components/Translation';
import type { Cluster } from '../../../../interface/cluster';
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
  cluster: Cluster;
};

class AddClustDialog extends React.Component<Props, State> {
  field: Field;
  DefinitionCodeRef: React.RefObject<DefinitionCode>;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.DefinitionCodeRef = React.createRef();
    this.state = {
      editMode: false,
      cluster: {
        name: '',
        kubeConfig: '',
      },
    };
  }

  componentDidMount() {
    this.loadClusterDetail();
  }

  loadClusterDetail = () => {
    const { editClusterName } = this.props;
    if (editClusterName) {
      getClusterDetails({ clusterName: editClusterName }).then((re) => {
        this.setState({ cluster: re, editMode: true });
      });
    }
  };

  onClose = () => {
    this.props.onClose();
    this.resetField();
  };

  onOk = () => {
    const { editMode, cluster } = this.state;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      if (editMode) {
        updateCluster({
          name: cluster.name,
          alias: values.alias,
          icon: cluster.icon,
          description: values.description,
          dashboardURL: values.dashboardURL,
          kubeConfig: values.kubeConfig,
          labels: cluster.labels,
        }).then(() => {
          Message.success(<Translation>cluster update success</Translation>);
          this.resetField();
          this.props.onOK();
        });
      } else {
        this.props.dispatch({
          type: 'clusters/createCluster',
          payload: values,
          callback: () => {
            Message.success(<Translation>cluster add success</Translation>);
            this.resetField();
            this.props.onOK();
          },
        });
      }
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

  onError = () => {};

  customRequest = (option: any) => {
    const reader = new FileReader();
    const fileselect = option.file;
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
    const { visible, editClusterName } = this.props;
    const { editMode, cluster } = this.state;
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
    const valueInfo = cluster.kubeConfig || values.kubeConfig || '';
    return (
      <Dialog
        className={'commonDialog'}
        title={editMode ? editCluster : addCluster}
        autoFocus={true}
        visible={visible}
        onOk={this.onOk}
        onCancel={this.onClose}
        onClose={this.onClose}
        footerActions={['ok', 'cancel']}
        height="800px"
        footerAlign="center"
      >
        <Loading visible={editClusterName && !editMode ? true : false} style={{ width: '100%' }}>
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={name} required>
                  <Input
                    name="name"
                    disabled={editMode}
                    placeholder={namePlaceHold}
                    {...init('name', {
                      initValue: cluster.name,
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
                      initValue: cluster.alias,
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
                    defaultValue={cluster.description}
                    name="description"
                    placeholder={describePlaceHold}
                    {...init('description', {
                      initValue: cluster.description,
                      rules: [
                        {
                          maxLength: 256,
                          message: 'Enter a description that contains less than 256 characters.',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
              <Col span={12} style={{ padding: '0 8px' }}>
                <FormItem label={dashboardURL}>
                  <Input
                    name="dashboardURL"
                    placeholder={dashboarPlaceHold}
                    {...init('dashboardURL', {
                      initValue: cluster.dashboardURL,
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
                      {...init('kubeConfig', {
                        initValue: cluster.kubeConfig,
                      })}
                      value={valueInfo}
                      ref={this.DefinitionCodeRef}
                    />
                  </div>
                </FormItem>
              </Col>
            </Row>
          </Form>
        </Loading>
      </Dialog>
    );
  }
}

export default AddClustDialog;
