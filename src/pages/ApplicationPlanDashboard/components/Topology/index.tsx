import React, { Component } from 'react';
import { ComponentBase, ComponentDefinitionBase } from '../../../../interface/component';
import { Affix, Grid } from '@b-design/ui';
import ComponentsGroup from '../ComponentsGroup';
import { getComponentdefinitions } from '../../../../api/application';
import { If } from 'tsx-control-statements/components';
import './index.less';
import { Link } from 'dva/router';
import { AppPlanDetail } from '../../../../interface/applicationplan';

const { Row } = Grid;

interface Props {
  appPlanDetail: AppPlanDetail;
  components: Array<ComponentBase>;
  showBox: boolean;
  onAddComponent: (componentType: string) => void;
}

interface State {
  componentDefinitions: Array<ComponentDefinitionBase>;
}

class Topology extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      componentDefinitions: [],
    };
  }

  componentDidMount() {
    this.onGetComponentdefinitions();
  }

  onGetComponentdefinitions = async () => {
    getComponentdefinitions({}).then((res) => {
      if (res) {
        this.setState({
          componentDefinitions: res && res.definitions,
        });
      }
    });
  };

  render() {
    const { components, showBox, onAddComponent, appPlanDetail } = this.props;
    const { componentDefinitions } = this.state;
    return (
      <div className="topology-body">
        <ul style={{ height: '100%' }}>
          {components &&
            components.map((component: ComponentBase) => {
              return (
                <li key={component.name}>
                  <Link
                    to={`/applicationplans/${appPlanDetail.name}/componentplans/${component.name}`}
                  >
                    {component.name}
                  </Link>
                </li>
              );
            })}
        </ul>
        <If condition={showBox}>
          <div className="components-wraper">
            {(componentDefinitions || []).map((item) => (
              <ComponentsGroup
                key={item.name}
                name={item.name}
                description={item.description}
                open={(componentType: string) => {
                  onAddComponent(componentType);
                }}
              />
            ))}
          </div>
        </If>
      </div>
    );
  }
}

export default Topology;
