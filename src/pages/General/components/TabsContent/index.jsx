import React, { useState, Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Message, Grid, Search, Icon, Select, Tab, Loading } from '@b-design/ui';
import Topology from '../Topology';
import { DropTarget } from 'react-dnd';
import ItemTypes from '../../types';
import NoData from '../../../../components/Nodata';
import './index.less';

const style = {
  width: '100%',
  color: 'white',
  fontSize: '1rem',
  lineHeight: 'normal',
  float: 'left',
};
const boxTarget = {
  drop: () => ({ name: 'Dustbin' }),
};

@DropTarget(ItemTypes.BOX, boxTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
}))
class TabsContent extends Component {
  constructor(props) {
    super(props);
    const { envBind = [] } = props;
    envBind.forEach((item) => (this[item.name] = React.createRef()));
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

  componentDidMount() {
    this.getApplicationComponents();
  }

  directComponentDetail = (componentName) => {
    const { appName } = this.props;
    this.props.history.push(`/applicationplans/${appName}/components/${componentName}`, {});
  };

  getEnvBindCLuster(env) {
    const { envBind } = this.props;
    const findEnvArr = envBind.filter((item) => item.name === env);
    if (findEnvArr.leng != 0) {
      return (findEnvArr[0].clusterSelector && findEnvArr[0].clusterSelector.name) || '';
    }
    return '';
  }

  transNodes(componentplans) {
    (componentplans || []).forEach((item) => {
      return (item.id = item.name);
    });
    return componentplans;
  }

  transEdges(componentplans) {
    const edges = [];
    (componentplans || []).forEach((item) => {
      if (Array.isArray(item.dependsOn)) {
        item.dependsOn.forEach((dependItem) => {
          const obj = {};
          obj.source = item.name;
          obj.target = dependItem;
          edges.push(obj);
        });
      }
    });
    return edges;
  }

  handleChange = (key) => {
    this.props.changeActiveKey(key);
    this.getApplicationComponents();
  };

  getApplicationComponents() {
    const { appName, activeKey } = this.props;
    const envName = activeKey === 'basisConfig' ? '' : activeKey;
    const params = {
      name: appName,
      envName: envName,
    };
    this.props.dispatch({
      type: 'application/getApplicationComponents',
      payload: params,
    });
  }

  render() {
    const { canDrop, isOver, activeKey, connectDropTarget, envBind, components = [] } = this.props;
    const isActive = canDrop && isOver;
    let backgroundColor = '#222';
    if (isActive) {
      backgroundColor = 'darkgreen';
    } else if (canDrop) {
      backgroundColor = 'darkkhaki';
    }

    const topologyNodes = this.transNodes(components);
    const topologyDataEdges = this.transEdges(components);

    if ((components || []).length === 0) {
      return <NoData width="300px" />
    }

    const tabsItem = (envBind || []).map((item) => {
      return (
        <Tab.Item title={item.name} key={item.name}>
          {(topologyNodes || []).length !== 0 && item.name === activeKey && (
            <Topology
              name={item.name}
              topologyNodes={topologyNodes}
              topologyDataEdges={topologyDataEdges}
              directComponentDetail={(componentName) => {
                this.directComponentDetail(componentName);
              }}
              ref={this[item.name]}
            />
          )}
        </Tab.Item>
      );
    });

    return (
      connectDropTarget &&
      connectDropTarget(
        <div style={{ ...style, backgroundColor }}>
          <div className="tabs-content">
            <Tab shape="wrapped" size="small" activeKey={activeKey} onChange={this.handleChange}>
              {tabsItem}
            </Tab>
          </div>
        </div>,
      )
    );
  }
}

export default TabsContent;
