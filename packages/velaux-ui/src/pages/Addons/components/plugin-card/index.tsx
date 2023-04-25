import React from 'react';
import { FaLink } from 'react-icons/fa';

import './index.less';

import { Card, Grid, Tag } from '@alifd/next';

type State = {
  iconValid: boolean
};

type Props = {
  id: string
  enabled?: boolean
  installed?: boolean
  icon?: string
  description?: string
  url?: string

  // default empty array
  tags: string[]
  history?: {
    push: (path: string, state?: any) => void;
    location: {
      pathname: string;
    };
  };
};


class PluginCard extends React.Component<Props, State> {
  static defaultProps = {
    tags: [],
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      iconValid: true
    };
  }

  checkImage = (icon?: string) => {
    if (icon && icon !== 'none' && icon !== '') {
      const img = new Image();
      img.src = icon;
      img.onload = () => {
        this.setState((preState) => {
          return { ...preState, iconValid: true };
        });
      }
      img.onerror = () => {
        this.setState((preState) => {
          return { ...preState, iconValid: false };
        });
      }
    } else {
      this.setState((preState) => {
        return { ...preState, iconValid: false };
      });
    }
  };

  componentDidMount() {
    this.checkImage(this.props.icon);
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.icon !== this.props.icon) {
      this.checkImage(this.props.icon);
    }
  }

  handleGoToPage = (id: string) => {
    this.props.history?.push(`/plugins/${id}`)
  }

  handleGoToPluginConfig = (id: string) => {
    this.props.history?.push(`/plugin-config/${id}`)
  }


  render() {
    const { Row, Col } = Grid;
    const {
      id,
      icon,
      tags,
      description,
      enabled,
      installed,
      url,
    } = this.props;
    console.log(url)

    const nameUpper = (name: string) => {
      return name
        .split('-')
        .map((sep) => {
          if (sep.length > 0) {
            return sep.toUpperCase()[0];
          }
          return sep;
        })
        .toString()
        .replace(',', '');
    };

    const renderIcon = (name: string, icon?: string) => {
      if (this.state.iconValid) {
        return <img src={icon} />;
      } else {
        return (
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              padding: `2px 4px`,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              textAlign: 'center',
              lineHeight: '60px',
            }}
          >
            <span style={{ color: '#1b58f4', fontSize: `2em` }}>{nameUpper(name)}</span>
          </div>
        );
      }
    }

    if (enabled && !tags.some((t) => t == "enabled")) {
      tags.unshift("enabled")
    }
    if (installed && !enabled && !tags.some((t) => t == "installed")) {
      tags.unshift("installed")
    }

    return (
      <div className={'plugin-card'}>
        <a onClick={() => this.handleGoToPluginConfig(id)}>
          <Card style={{ background: 'transparent', borderStyle: 'none', color: 'black' }} contentHeight={180}>
            <Row align={"center"}>
              <Col l={8}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderIcon(id, icon)}
                </div>
              </Col>
              <Col l={16}>
                {enabled &&
                    <a onClick={(e) => {
                      e.stopPropagation();
                      this.handleGoToPage(id)
                    }}>
                      <span style={{ fontSize: '20px' }}>{id}</span><FaLink />
                    </a>
                }
                {
                  !enabled && <div style={{ fontSize: '20px' }}>{id}</div>
                }
              </Col>
            </Row>
            <div className={'plugin-card-content'}>
              <Row id={'desc'} className={'plugin-desc'}>
                <h4 className={'font-size-14'}>{description ? description : "No descriptions"}</h4>
              </Row>
              <Row id={'tags'} gutter={8}>
                  <div style={{ fontSize: '14px' }}>
                    {tags.map((t: string) => {
                        return (
                          <Tag type="normal">{t}</Tag>
                        );
                      }
                    )}
                  </div>
              </Row>
            </div>
          </Card>
        </a>
      </div>

    );
  }
}

export default PluginCard;
