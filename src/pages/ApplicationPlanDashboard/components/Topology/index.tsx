import React, { Component } from 'react';
import { ComponentBase, ComponentDefinitionBase } from '../../../../interface/component';
import { Affix, Grid } from '@b-design/ui';
import ComponentsGroup from '../ComponentsGroup';
import { getComponentdefinitions } from '../../../../api/application';
import { If } from 'tsx-control-statements/components';
import './index.less';

const { Row } = Grid;

interface Props {
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
    const { components, showBox, onAddComponent } = this.props;
    const { componentDefinitions } = this.state;
    return (
      <div className="topology-body">
        <ul style={{ height: '100%' }}>
          {components &&
            components.map((component: ComponentBase) => {
              return <li>{component.name}</li>;
            })}
        </ul>
        <If condition={showBox}>
          <div className="components-wraper">
            {(componentDefinitions || []).map((item) => (
              <ComponentsGroup
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
