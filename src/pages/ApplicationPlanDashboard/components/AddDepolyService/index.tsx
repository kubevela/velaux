import React, { Component } from 'react';
import { Checkbox, Grid, Form } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import './index.less';

type Props = {
  components: [];
};
type State = {
  componentServices: [] | Array<ComponentItem>;
  allChecked: boolean;
};

type ComponentItem = {
  id: string;
  alias?: string;
  name: string;
  checked: boolean;
};

class addCheckDepolySercice extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      componentServices: (props.components || []).map((item: ComponentItem) => ({
        id: this.getName(item),
        name: this.getName(item),
        checked: true,
      })),
      allChecked: true,
    };
  }

  onChange = (flag: boolean, event: any) => {
    const id = event?.target.id;
    if (flag) {
      this.addChecked(id);
    } else {
      this.removeChecked(id);
    }
  };

  removeChecked = (id: string) => {
    const { componentServices } = this.state;
    componentServices.forEach((item: ComponentItem) => {
      if (item.id === id) {
        item.checked = false;
      }
    });
    const notCheckedAll = componentServices.every((item: ComponentItem) => item.checked === false);
    if (notCheckedAll) {
      this.setState({
        allChecked: false,
      });
    }
    this.setState({ componentServices: componentServices });
  };

  addChecked = (id: string) => {
    const { componentServices } = this.state;
    componentServices.forEach((item: ComponentItem) => {
      if (item.id === id) {
        item.checked = true;
      }
    });

    const isCheckedAll = componentServices.every((item: ComponentItem) => item.checked === true);
    if (isCheckedAll) {
      this.setState({
        allChecked: true,
      });
    }

    this.setState({ componentServices: componentServices });
  };

  onChangeAll = (flag: boolean) => {
    const { componentServices } = this.state;
    if (flag) {
      const newComponentServices = componentServices.map((item: ComponentItem) => ({
        id: item.name,
        name: item.name,
        checked: true,
      }));
      this.setState({ componentServices: newComponentServices, allChecked: true });
    } else {
      const newComponentServices = componentServices.map((item: ComponentItem) => ({
        id: item.name,
        name: item.name,
        checked: false,
      }));
      this.setState({ componentServices: newComponentServices, allChecked: false });
    }
  };

  getName = (item: ComponentItem) => {
    return item.alias ? item.alias : item.name;
  }

  render() {
    const { Row, Col } = Grid;
    const { componentServices, allChecked } = this.state;
    return (
      <div className="dialog-deploy-service">
        <Row className="checkoubox-title">
          <Col span="24">
            <div>
              <Translation>Please select a service to deploy</Translation>:
              <span className="margin-left-20">
                <Checkbox
                  id={'all'}
                  defaultChecked={true}
                  checked={allChecked}
                  onChange={this.onChangeAll}
                >
                  <Translation>All</Translation>
                </Checkbox>
              </span>
            </div>
          </Col>
        </Row>
        <Row wrap={true} className="checkoubox-content">
          {componentServices.map((item: ComponentItem) => (
            <Col span="6">
              <Checkbox
                id={item.name}
                checked={item.checked}
                onChange={(flag, e) => {
                  this.onChange(flag, e);
                }}
              >
                <label htmlFor={item.name} className="next-checkbox-label">
                  {item.name}
                </label>
              </Checkbox>
            </Col>
          ))}
        </Row>
      </div>
    );
  }
}

export default addCheckDepolySercice;
