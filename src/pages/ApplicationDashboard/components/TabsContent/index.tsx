import React, { Component } from 'react';
import { Tab } from '@b-design/ui';
import './index.less';
import Translation from '../../../../components/Translation';
import type { EnvBinding } from '../../../../interface/application';

type Props = {
  changeActiveKey: (key: string | number) => void;
  activeKey: string;
  envBind: EnvBinding[];
};

class TabsContent extends Component<Props> {
  constructor(props: Props) {
    super(props);
    this.state = {
      topologyNodes: [],
      topologyDataEdges: [],
    };
  }

  handleChange = (key: string | number) => {
    this.props.changeActiveKey(key);
  };

  render() {
    const { activeKey, envBind } = this.props;

    return (
      <div>
        <div className="tabs-content">
          <Tab shape="wrapped" size="small" activeKey={activeKey} onChange={this.handleChange}>
            <Tab.Item title={<Translation>BasisConfig</Translation>} key={'basisConfig'} />
            {(envBind || []).map((item) => {
              return <Tab.Item title={item.alias ? item.alias : item.name} key={item.name} />;
            })}
          </Tab>
        </div>
      </div>
    );
  }
}

export default TabsContent;
