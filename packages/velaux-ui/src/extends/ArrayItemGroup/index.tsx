import { Icon, Loading, Grid } from '@alifd/next';
import React from 'react';
import { AiOutlineDelete } from 'react-icons/ai';
import './index.less';

type Props = {
  id: string;
  children?: React.ReactNode;
  loading?: boolean;
  labelTitle: string | React.ReactElement;
  delete: (id: string) => void;
};

type State = {
  closed: boolean | undefined;
};

class ArrayItemGroup extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      closed: true,
    };
  }

  toggleShowClass = () => {
    const { closed } = this.state;
    this.setState({
      closed: !closed,
    });
  };

  render() {
    const { children, labelTitle, loading } = this.props;
    const { closed } = this.state;
    const { Col, Row } = Grid;
    return (
      <Loading visible={loading || false} style={{ width: '100%' }}>
        <div className="spection-group-container">
          <div className="spection-group-title-container">
            <Row>
              <Col span={'21'}>
                <div>{labelTitle}</div>
              </Col>
              <Col span={'3'}>
                <div>
                  <Icon
                    onClick={this.toggleShowClass}
                    className="icon-toggle"
                    type={closed ? 'arrow-down' : 'arrow-up'}
                    style={closed ? { top: '-2px' } : { top: '0' }}
                  />
                  <AiOutlineDelete
                    className="icon-delete"
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
          <div className={`array-item-group-box ${closed ? 'disable' : ''}`}>{children}</div>
        </div>
      </Loading>
    );
  }
}

export default ArrayItemGroup;
