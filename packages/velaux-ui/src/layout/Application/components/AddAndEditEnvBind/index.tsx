import { Dialog, Field, Form, Grid, Message, Select, Button } from '@alifd/next';
import { connect } from 'dva';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createApplicationEnvbinding, updateApplicationEnvbinding } from '../../../../api/application';
import { getEnvs } from '../../../../api/env';
import { If } from '../../../../components/If';
import { Translation } from '../../../../components/Translation';
import type { ApplicationDetail, EnvBinding , Env , LoginUserInfo } from '@velaux/data';
import EnvDialog from '../../../../pages/EnvPage/components/EnvDialog';
import { showAlias } from '../../../../utils/common';
import { locale } from '../../../../utils/locale';

interface Props {
  onClose: () => void;
  onOK: () => void;
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
  targets?: [];
  userInfo?: LoginUserInfo;
  dispatch?: Dispatch<any>;
}

interface State {
  loading: boolean;
  envs?: Env[];
  isEdit: boolean;
  visibleEnvDialog: boolean;
}

type Callback = (envName: string) => void;

@connect((store: any) => {
  return { ...store.application, ...store.target, ...store.user };
})
class EnvBindPlanDialog extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
      isEdit: false,
      visibleEnvDialog: false,
    };
  }

  componentDidMount() {
    this.loadEnvs();
    this.getTargets();
  }

  loadEnvs = async (callback?: Callback) => {
    const { applicationDetail, envbinding } = this.props;
    if (applicationDetail && applicationDetail.project?.name) {
      //Temporary logic
      getEnvs({ project: applicationDetail.project?.name, page: 0 }).then((re) => {
        const existEnvs =
          envbinding?.map((eb) => {
            return eb.name;
          }) || [];
        const allEnvs: [] = re.envs || [];
        const canAdd = allEnvs.filter((env: Env) => !existEnvs.includes(env.name));
        this.setState({ envs: canAdd });
        const envOption = canAdd?.map((env: { name: string; alias: string }) => {
          return {
            label: showAlias(env.name, env.alias),
            value: env.name,
          };
        });
        if (callback) {
          callback(envOption[0]?.value || '');
        }
      });
    }
  };

  onSubmit = () => {
    const { applicationDetail } = this.props;
    if (!applicationDetail) {
      return;
    }
    const { isEdit } = this.state;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.setState({ loading: true });
      const { name } = values;
      const params = {
        appName: applicationDetail && applicationDetail.name,
        name,
      };
      if (isEdit) {
        this.onUpdateApplicationEnv(params);
        return;
      }
      this.onCreateApplicationEnv(params);
    });
  };

  onCreateApplicationEnv(params: any) {
    createApplicationEnvbinding(params)
      .then((res) => {
        if (res) {
          Message.success(<Translation>Environment bound successfully</Translation>);
          this.props.onOK();
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  onUpdateApplicationEnv(params: any) {
    updateApplicationEnvbinding(params)
      .then((res: any) => {
        if (res) {
          Message.success(<Translation>Environment bound successfully</Translation>);
          this.props.onOK();
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }
  getTargets = async () => {
    this.props.dispatch?.({
      type: 'target/listTargets',
      payload: {},
    });
  };

  onCloseEnvDialog = () => {
    this.setState({
      visibleEnvDialog: false,
    });
  };

  onOKEnvDialog = () => {
    this.setState(
      {
        visibleEnvDialog: false,
      },
      () => {
        this.loadEnvs(this.setEnvValue);
      }
    );
  };
  changeEnvDialog = (visible: boolean) => {
    this.setState({
      visibleEnvDialog: visible,
    });
  };

  setEnvValue = (name: string) => {
    this.field.setValues({ name });
  };
  render() {
    const { loading, isEdit, envs, visibleEnvDialog } = this.state;
    const { userInfo } = this.props;
    const { Row, Col } = Grid;
    const FormItem = Form.Item;
    const init = this.field.init;
    const formItemLayout = {
      labelCol: {
        fixedSpan: 6,
      },
      wrapperCol: {
        span: 20,
      },
    };
    const envOption = envs?.map((env) => {
      return {
        label: env.alias ? `${env.alias}(${env.name})` : env.name,
        value: env.name,
      };
    });
    return (
      <React.Fragment>
        <Dialog
          v2
          visible={true}
          locale={locale().Dialog}
          style={{ width: '600px' }}
          overflowScroll={true}
          footerActions={['ok']}
          onClose={this.props.onClose}
          footer={
            <Button type="primary" onClick={this.onSubmit} loading={loading}>
              {!isEdit ? <Translation>Submit</Translation> : <Translation>Save</Translation>}
            </Button>
          }
          title={<Translation>Bind Environment</Translation>}
        >
          <Form {...formItemLayout} field={this.field}>
            <Row>
              <Col span={24} style={{ padding: '0 8px' }}>
                <FormItem
                  label={<Translation className="font-size-14 font-weight-bold">Environment</Translation>}
                  help={
                    <a
                      onClick={() => {
                        this.changeEnvDialog(true);
                      }}
                    >
                      <Translation>New Environment</Translation>
                    </a>
                  }
                  required={true}
                >
                  <Select
                    name="name"
                    locale={locale().Select}
                    disabled={isEdit ? true : false}
                    dataSource={envOption}
                    maxLength={32}
                    {...init('name', {
                      rules: [
                        {
                          required: true,
                          message: 'Please select an env',
                        },
                      ],
                    })}
                  />
                </FormItem>
              </Col>
            </Row>
          </Form>
        </Dialog>
        <If condition={visibleEnvDialog}>
          <EnvDialog
            visible={visibleEnvDialog}
            projects={userInfo?.projects || []}
            userInfo={userInfo}
            project={this.props.applicationDetail?.project?.name}
            isEdit={false}
            onClose={this.onCloseEnvDialog}
            onOK={this.onOKEnvDialog}
          />
        </If>
      </React.Fragment>
    );
  }
}

export default EnvBindPlanDialog;
