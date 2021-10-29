import React, { useState, Component } from 'react';
import PropTypes from 'prop-types';

import { Button, Message, Grid, Search, Icon, Select, Tab } from '@b-design/ui';
import Translation from '../../../../components/Translation';
import { addClust, clustGroup, clustTitle, clustSubTitle } from '../../constants';
import Topology from '../topology';
import { DropTarget } from 'react-dnd';
import ItemTypes from '../../types';
import './index.less';
const style = {
  width: '100%',
  color: 'white',
  fontSize: '1rem',
  lineHeight: 'normal',
  float: 'left',
};
const boxTarget = {
  // 当有对应的 drag source 放在当前组件区域时，会返回一个对象，可以在 monitor.getDropResult() 中获取到
  drop: () => ({ name: 'Dustbin' }),
};

@DropTarget(
  // type 标识，这里是字符串 'box'
  ItemTypes.BOX,
  // 接收拖拽的事件对象
  boxTarget,
  // 收集功能函数，包含 connect 和 monitor 参数
  // connect 里面的函数用来将 DOM 节点与 react-dnd 的 backend 建立联系
  (connect, monitor) => ({
    // 包裹住 DOM 节点，使其可以接收对应的拖拽组件
    connectDropTarget: connect.dropTarget(),
    // drag source是否在 drop target 区域
    isOver: monitor.isOver(),
    // 是否可以被放置
    canDrop: monitor.canDrop(),
  }),
)
class TabsContent extends Component {
  static propTypes = {
    canDrop: PropTypes.bool.isRequired,
    isOver: PropTypes.bool.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
  };
  handleChange = (key) => {
  };
  render() {
    const { canDrop, isOver, connectDropTarget } = this.props;
    const isActive = canDrop && isOver;
    let backgroundColor = '#222';
    // 拖拽组件此时正处于 drag target 区域时，当前组件背景色变为 darkgreen
    if (isActive) {
      backgroundColor = 'darkgreen';
    }
    // 当前组件可以放置 drag source 时，背景色变为 pink
    else if (canDrop) {
      backgroundColor = 'darkkhaki';
    }

    return (
      connectDropTarget &&
      connectDropTarget(
        <div style={{ ...style, backgroundColor }}>
          <div className="tabs-content">
            <Tab shape="wrapped" size="small" onChange={this.handleChange}>
              <Tab.Item title={<Translation>Application topology</Translation>}>
                <Topology />
              </Tab.Item>
              <Tab.Item title={<Translation>YY Cluster</Translation>}>YY集群 content</Tab.Item>
              <Tab.Item title={<Translation>zz Cluster</Translation>}>ZZ集群 Content</Tab.Item>
            </Tab>
          </div>
        </div>,
      )
    );
  }
}

export default TabsContent;
