import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tab, Button } from '@b-design/ui';
import './index.less';
import Translation from '../../../../components/Translation';
import { EnvBind } from '../../../../interface/applicationplan';

const style = {
  width: '100%',
  color: 'white',
  fontSize: '1rem',
  lineHeight: 'normal',
  float: 'left',
};

type Props = {
  changeActiveKey: (key: string | number) => void;
  changeAddEnvVisible: (visible: boolean) => void;
  changeEditEnvVisible: (visible: boolean) => void;
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

  renderAddEnvBtn = () => {
    return (
      <a
        className="margin-right-10"
        onClick={() => {
          this.props.changeAddEnvVisible(true);
        }}
      >
        <Translation>Add Environment</Translation>
      </a>
    );
  };

  render() {
    const { activeKey, envBind } = this.props;

    return (
      <div>
        <div className="tabs-content">
          <Tab
            shape="wrapped"
            size="small"
            activeKey={activeKey}
            onChange={this.handleChange}
            extra={this.renderAddEnvBtn()}
          >
            <Tab.Item title={<Translation>BasisConfig</Translation>} key={'basisConfig'}></Tab.Item>
            {(envBind || []).map((item) => {
              return (
                <Tab.Item title={item.alias ? item.alias : item.name} key={item.name}>
                  <div className="float-right">
                    <Button
                      type="normal"
                      className="margin-right-10 margin-top-10"
                      onClick={() => {
                        this.props.changeEditEnvVisible(true);
                      }}
                    >
                      <Translation>Setting environment differences</Translation>
                    </Button>
                  </div>
                </Tab.Item>
              );
            })}
          </Tab>
        </div>
      </div>
    );
  }
}

export default TabsContent;
