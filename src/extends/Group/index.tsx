import React from 'react';

import { Icon, Loading, Grid, Switch, Field, Dialog } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
import Translation from '../../components/Translation';
import locale from '../../utils/locale';
import './index.less';

const { Col, Row } = Grid;
type Props = {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  closed?: boolean;
  loading?: boolean;
  hasToggleIcon?: boolean;
  required?: boolean;
  field?: Field;
  jsonKey?: string;
  propertyValue?: any;
  onChange?: (values: any) => void;
};

type State = {
  closed: boolean | undefined;
  enable?: boolean;
  checked: boolean;
};

class Group extends React.Component<Props, State> {
  dom: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      closed: props.closed,
      enable: props.required,
      checked: false,
    };
  }

  toggleShowClass = () => {
    const { closed } = this.state;
    this.setState({
      closed: !closed,
    });
  };

  componentDidMount() {
    this.initSwitchState();
  }

  initSwitchState = () => {
    const { jsonKey = '', propertyValue = {} } = this.props;
    const findKey = Object.keys(propertyValue).find((item) => item === jsonKey);
    if (findKey) {
      this.setState({ enable: true, closed: false, checked: true });
    } else {
      this.setState({ enable: false, closed: false, checked: false });
    }
  };

  removeJsonKeyValue() {
    const { jsonKey = '', onChange } = this.props;
    const field: Field | undefined = this.props.field;
    if (field && onChange) {
      field.remove(jsonKey);
      const values = field.getValues();
      onChange(values);
    }
  }

  render() {
    const { title, description, children, hasToggleIcon, loading, required } = this.props;
    const { closed, enable, checked } = this.state;
    return (
      <Loading visible={loading || false} style={{ width: '100%' }}>
        <div className="group-container">
          <div className="group-title-container">
            <Row>
              <Col span={21}>
                {title}
                <div className="group-title-desc">{description}</div>
              </Col>
              <Col span={3} className="flexcenter">
                <If condition={!required}>
                  <Switch
                    size="small"
                    defaultChecked={required}
                    checked={checked}
                    onChange={(event: boolean) => {
                      if (event === true) {
                        this.setState({ enable: event, closed: false, checked: true });
                      } else if (event === false) {
                        Dialog.confirm({
                          type: 'confirm',
                          content: (
                            <Translation>
                              If Swtich is turned off, user data will be reset. Are you sure you
                              want to do it?
                            </Translation>
                          ),
                          onOk: () => {
                            this.setState({ enable: event, closed: false, checked: false });
                            this.removeJsonKeyValue();
                          },
                          locale: locale.Dialog,
                        });
                      }
                    }}
                  />
                </If>
                <If condition={enable && hasToggleIcon}>
                  <Icon
                    onClick={this.toggleShowClass}
                    className="icon"
                    type={closed ? 'arrow-down' : 'arrow-up'}
                  />
                </If>
              </Col>
            </Row>
          </div>
          <If condition={enable && (!hasToggleIcon || !closed)}>
            <div className="group-box">{children}</div>
          </If>
          <If condition={closed && enable}>
            <div className="group-box disable">{children}</div>
          </If>
        </div>
      </Loading>
    );
  }
}

export default Group;
