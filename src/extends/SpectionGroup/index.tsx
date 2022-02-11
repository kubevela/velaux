import React from 'react';
import { Icon, Loading, Grid } from '@b-design/ui';
import './index.less';

type Props = {
  id: string;
  title?: string;
  children?: React.ReactNode;
  loading?: boolean;
  delete: (id: string) => void;

};

class SpectionGroup extends React.Component<Props> {
  render() {
    const {
      title,
      children,
      loading,
    } = this.props;
    const { Col, Row } = Grid;
    return (
      <Loading visible={loading || false} style={{ width: '100%' }}>
        <div className="spection-group-container">
          <div className="spection-group-title-container">
            <Row>
              <Col span={'21'}>
                {title}
              </Col>
              <Col span={'3'} className="">
                <div className="flexright">
                  <Icon
                    type="delete"
                    size={'medium'}
                    onClick={() => {
                      if (this.props.delete) {
                        this.props.delete(this.props.id);
                      }
                    }}
                  />
                </div>
              </Col>
            </Row>
          </div>
          <div className="spection-group-box">{children}</div>
        </div>
      </Loading>
    );
  }
}

export default SpectionGroup;
