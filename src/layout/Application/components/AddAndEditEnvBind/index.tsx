import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import { Dialog, Field, Form, Grid, Message, Select, Button } from '@b-design/ui';
import type { ApplicationDetail, EnvBinding } from '../../../../interface/application';
import { createApplicationEnv, updateApplicationEnv } from '../../../../api/application';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import { getEnvs } from '../../../../api/env';
import type { Env } from '../../../../interface/env';

interface Props {
  onClose: () => void;
  onOK: () => void;
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
}

interface State {
  loading: boolean;
  envs?: Env[];
  isEdit: boolean;
}

@connect((store: any) => {
  return { ...store.application };
})
class EnvBindPlanDialog extends Component<Props, State> {
  field: Field;
  constructor(props: Props) {
    super(props);
    this.field = new Field(this);
    this.state = {
      loading: false,
      isEdit: false,
    };
  }

  componentDidMount() {
    this.loadEnvs();
  }

  loadEnvs = async () => {
    const { applicationDetail, envbinding } = this.props;
    if (applicationDetail) {
      getEnvs({ project: applicationDetail?.project?.name, page: 0 }).then((re) => {
        const existEnvs =
          envbinding?.map((eb) => {
            return eb.name;
          }) || [];
        const allEnvs: [] = re.envs || [];
        const canAdd = allEnvs.filter((env: Env) => !existEnvs.includes(env.name));
        this.setState({ envs: canAdd });
      });
    }
  };

  onSubmit = () => {
    const { applicationDetail } = this.props;
    const { isEdit } = this.state;
    this.field.validate((error: any, values: any) => {
      if (error) {
        return;
      }
      this.setState({ loading: true });
      const { name, alias, description, targetNames } = values;
      const params = {
        appName: applicationDetail && applicationDetail.name,
        name,
        alias,
        targetNames,
        description,
      };
      if (isEdit) {
        this.onUpdateApplicationEnv(params);
        return;
      }
      this.onCreateApplicationEnv(params);
    });
  };

  onCreateApplicationEnv(params: any) {
    createApplicationEnv(params)
      .then((res) => {
        if (res) {
          Message.success(<Translation>Bind Environment Success</Translation>);
          this.props.onOK();
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  onUpdateApplicationEnv(params: any) {
    updateApplicationEnv(params)
      .then((res: any) => {
        if (res) {
          Message.success(<Translation>Bind Environment Success</Translation>);
          this.props.onOK();
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  }
  render() {
    const { loading, isEdit, envs } = this.state;
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
      <Dialog
        visible={true}
        locale={locale.Dialog}
        className={'commonDialog'}
        style={{ width: '600px' }}
        isFullScreen={true}
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
              <FormItem label={<Translation>Environment</Translation>} required={true}>
                <Select
                  name="name"
                  locale={locale.Select}
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
    );
  }
}

export default withTranslation()(EnvBindPlanDialog);
