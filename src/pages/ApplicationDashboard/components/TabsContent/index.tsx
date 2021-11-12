import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tab } from '@b-design/ui';
import './index.less';
import Translation from '../../../../components/Translation';
import { EnvBind } from '../../../../interface/application';

const style = {
  width: '100%',
  color: 'white',
  fontSize: '1rem',
  lineHeight: 'normal',
  float: 'left',
};

type Props = {
  changeActiveKey: (key: string | number) => void;
  activeKey: string;
  envBind: Array<EnvBind>;
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
            <Tab.Item title={<Translation>BasisConfig</Translation>} key={'basisConfig'}></Tab.Item>
            {(envBind || []).map((item) => {
              return (
                <Tab.Item title={item.alias ? item.alias : item.name} key={item.name}></Tab.Item>
              );
            })}
          </Tab>
        </div>
      </div>
    );
  }
}

export default TabsContent;
