import React from 'react';
import { FaLink } from 'react-icons/fa';

import './index.less';

import { Box, Button, Card, Grid, Tag } from '@alifd/next';
import i18n from "i18next";
import { checkImage } from "../../../../utils/icon";

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
  onInstall: (id: string, url: string) => void
};


class PluginCard extends React.Component<Props, State> {
  static defaultProps = {
    tags: [],
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      iconValid: false,
    };
  }

  setValid = (valid: boolean) => {
    this.setState((preState) => {
      return { ...preState, iconValid: valid }
    })
  }

  componentDidMount() {
    if (this.props.icon) {
      checkImage(this.props.icon, this.setValid)
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.icon !== this.props.icon && this.props.icon) {
      checkImage(this.props.icon, this.setValid)
    }
  }

  handleGoToPage = (id: string) => {
    this.props.history?.push(`/plugins/${id}`)
  }

  handleInstall = (id: string, url: string) => {
    this.props.onInstall(id, url)
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
            <Box align={"center"} spacing={16} direction={'row'}>
              <Box >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderIcon(id, icon)}
                </div>
              </Box>
              <Box >
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
              </Box>
            </Box>
            <div className={'plugin-card-content'}>
              <Row id={'desc'} className={'plugin-desc'}>
                <h4 className={'font-size-14'}>{description ? description : "No descriptions"}</h4>
              </Row>
              <Row id={'tags'} gutter={1}>
                <Col span={
                  (url && url !== "" && !installed) ? 18 : 24
                }>
                  <Box direction={'row'} wrap={true} spacing={[4, 4]}>
                    {tags.map((t: string) => {
                        return (
                          <Tag size={'small'} className={'tag'} type={t === 'enabled'||t === 'installed' ? 'primary' : 'normal'} color={
                            t === 'installed'||t === 'enabled'? 'green' : ''
                          }>{t}</Tag>
                        );
                      }
                    )}
                    <Tag size={'small'} type="normal">{'test1'}</Tag>
                    <Tag size={'small'} type="normal">{'test2'}</Tag>
                    <Tag size={'small'} type="normal">{'test3'}</Tag>
                    <Tag size={'small'} type="normal">{'test4'}</Tag>
                  </Box>
                </Col>
                {url && url !== "" && !installed &&
                    <Col span={6}>
                      <Box align={'flex-end'}>
                        <Button className={'no-hover'} type={"primary"}  onClick={(e) => {
                          e.stopPropagation();
                          this.handleInstall(id, url)
                        }}>{i18n.t('Install')}</Button>
                      </Box>
                    </Col>
                }
              </Row>
            </div>
          </Card>
        </a>
      </div>

    );
  }
}

export default PluginCard;
