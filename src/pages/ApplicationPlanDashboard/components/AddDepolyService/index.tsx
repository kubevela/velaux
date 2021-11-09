import React, { Component } from 'react';
import { Checkbox, Grid, Form } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import _ from 'lodash';
import './index.less';

type Props = {
  allComponents: [];
  componentSelectorComponents?: any;
  isEdit: boolean;
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
    const initObj = this.getInitComService();
    this.state = {
      componentServices: initObj.componentServices,
      allChecked: initObj.allChecked,
    };
  }

  getInitComService() {
    const { isEdit, allComponents, componentSelectorComponents = [] } = this.props;
    const cloneAllComponents = _.cloneDeep(allComponents) || [];
    if (isEdit) {
      let allChecked = true;
      cloneAllComponents.forEach((item: any) => {
        if (componentSelectorComponents.includes(item.name)) {
          item.checked = true;
        } else {
          item.checked = false;
        }
      });
      cloneAllComponents.map((item: ComponentItem) => {
        if (!item.checked) {
          allChecked = false;
        }
      });

      return {
        componentServices: (cloneAllComponents || []).map((item: ComponentItem) => ({
          id: item.name,
          name: item.name,
          alias: item.alias,
          checked: item.checked,
        })),
        allChecked: allChecked,
      };
    } else {
      return {
        componentServices: (allComponents || []).map((item: ComponentItem) => ({
          id: item.name,
          name: item.name,
          alias: item.alias,
          checked: true,
        })),
        allChecked: true,
      };
    }
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
    const cloneComponentServices = _.cloneDeep(componentServices);
    cloneComponentServices.forEach((item: ComponentItem) => {
      if (item.id === id) {
        item.checked = false;
      }
    });
    const notCheckedAll = cloneComponentServices.every(
      (item: ComponentItem) => item.checked === false,
    );
    if (notCheckedAll) {
      this.setState({
        allChecked: false,
      });
    }
    this.setState({ componentServices: cloneComponentServices });
  };

  addChecked = (id: string) => {
    const { componentServices } = this.state;
    const cloneComponentServices = _.cloneDeep(componentServices);
    cloneComponentServices.forEach((item: ComponentItem) => {
      if (item.id === id) {
        item.checked = true;
      }
    });

    const isCheckedAll = cloneComponentServices.every(
      (item: ComponentItem) => item.checked === true,
    );
    if (isCheckedAll) {
      this.setState({
        allChecked: true,
      });
    }

    this.setState({ componentServices: cloneComponentServices });
  };

  onChangeAll = (flag: boolean) => {
    const { componentServices } = this.state;
    if (flag) {
      const newComponentServices = componentServices.map((item: ComponentItem) => ({
        id: item.name,
        name: item.name,
        alias: item.alias,
        checked: true,
      }));
      this.setState({ componentServices: newComponentServices, allChecked: true });
    } else {
      const newComponentServices = componentServices.map((item: ComponentItem) => ({
        id: item.name,
        name: item.name,
        alias: item.alias,
        checked: false,
      }));
      this.setState({ componentServices: newComponentServices, allChecked: false });
    }
  };

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
                id={item.id}
                checked={item.checked}
                onChange={(flag, e) => {
                  this.onChange(flag, e);
                }}
              >
                <label htmlFor={item.id} className="next-checkbox-label">
                  {item.alias || item.name}
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
