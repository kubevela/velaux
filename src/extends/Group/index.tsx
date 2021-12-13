import React from 'react';

import { Icon, Loading, Grid, Switch, Field } from '@b-design/ui';
import { If } from 'tsx-control-statements/components';
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
  onChange?: (values: any) => void;
};

type State = {
  closed: boolean | undefined;
  enable?: boolean;
};

class Group extends React.Component<Props, State> {
  dom: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      closed: props.closed,
      enable: props.required,
    };
  }

  toggleShowClass = () => {
    const { closed } = this.state;
    this.setState({
      closed: !closed,
    });
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
    const { closed, enable } = this.state;
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
                    onChange={(event: boolean) => {
                      this.setState({ enable: event, closed: false });
                      if (event === false) {
                        this.removeJsonKeyValue();
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
