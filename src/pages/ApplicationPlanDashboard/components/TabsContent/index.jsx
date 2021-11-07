import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tab } from '@b-design/ui';
import './index.less';
import Translation from '../../../../components/Translation';

const style = {
  width: '100%',
  color: 'white',
  fontSize: '1rem',
  lineHeight: 'normal',
  float: 'left',
};

class TabsContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topologyNodes: [],
      topologyDataEdges: [],
    };
  }
  static propTypes = {
    canDrop: PropTypes.bool.isRequired,
    isOver: PropTypes.bool.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
  };

  handleChange = (key) => {
    this.props.changeActiveKey(key);
  };

  render() {
    const { canDrop, isOver, activeKey, envBind } = this.props;
    const isActive = canDrop && isOver;
    let backgroundColor = '#222';
    if (isActive) {
      backgroundColor = 'darkgreen';
    } else if (canDrop) {
      backgroundColor = 'darkkhaki';
    }
    return (
      <div style={{ ...style, backgroundColor }}>
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
