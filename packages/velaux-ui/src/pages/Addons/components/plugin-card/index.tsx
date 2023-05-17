import React from 'react';
import { HiOutlineExternalLink } from "react-icons/hi"

import './index.less';

import { Box, Button, Card, Grid, Tag } from '@alifd/next';
import i18n from "i18next";
import { If } from '../../../../components/If';
import { Addon } from "@velaux/data";
import { renderIcon } from "@velaux/ui/src/utils/icon";

type State = {
  iconValid: boolean
};

type Props = {
  id: string
  enabled?: boolean
  installed?: boolean
  icon?: string
  description?: string
  sourceAddon?: Addon;
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
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.icon !== this.props.icon && this.props.icon) {
    }
  }

  handleGoToPage = (id: string) => {
    this.props.history?.push(`/plugins/${id}`)
  }

  handleInstall = (id: string, url: string) => {
    this.props.onInstall(id, url)
  }

  handleGoToPluginConfig = (id: string) => {
    if (this.props.installed) {
      this.props.history?.push(`/manage/plugins/${id}/config`)
    }
  }


  render() {
    const { Row, Col } = Grid;
    const {
      id,
      icon,
      tags,
      description,
      sourceAddon,
      enabled,
      installed,
      url,
    } = this.props;

    function getTags() {
      let ts = [...tags, ...(sourceAddon?.tags ?? [])]
      if (sourceAddon) {
        ts.unshift(`from: ${sourceAddon.name}`)
      }
      return ts
    }

    return (

      <div className={
        'plugin-card'
      }>
        <a onClick={() =>
          this
            .handleGoToPluginConfig(id)
        }>
          <Card style={{ border: 'none' }} contentHeight={180}>
            <Box direction={'column'}>
              <Box align={"flex-start"} direction={"row"}>
                <Box align={"center"} spacing={8} direction={'row'}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {renderIcon(id, icon)}
                  </div>
                  {enabled &&
                      <a onClick={(e) => {
                        e.stopPropagation();
                        this.handleGoToPluginConfig(id)
                      }}>
                        <span style={{ fontSize: '20px' }}>{id}</span>
                      </a>
                  }
                  {
                    !enabled && <div className={'font-color-keep'} style={{ fontSize: '20px' }}>{id}</div>
                  }
                </Box>
                <div style={{ marginLeft: 'auto' ,marginTop: '4px'}}>
                  {enabled &&
                      <a onClick={(e) => {
                        e.stopPropagation();
                        this.handleGoToPage(id)
                      }}>
                        <span style={{ fontSize: '16px' }}><HiOutlineExternalLink /></span>
                      </a>
                  }
                </div>
              </Box>
              <Box className={'plugin-card-content'} direction={'column'} justify={'space-between'}
                   style={{ height: '100%' }}>
                <Box id={'desc'} className={'plugin-desc'}>
                  <h4 className={'font-size-14 font-color-keep'}>
                    {description ?? (sourceAddon?.description ?? "No descriptions")}
                  </h4>
                </Box>
              </Box>
              <Box className={'plugin-card-footer'}>
                <Row id={'tags'} gutter={1}>
                  <Col span={18}>
                    <Box direction={'row'} wrap={true} spacing={[4, 4]}>
                      {getTags().map((t: string) => {
                          return (
                            <div className={'hover-none'}>
                              <Tag size={'small'} className={'tag'} type={'normal'}>{t}</Tag>
                            </div>
                          );
                        }
                      )}
                    </Box>
                  </Col>
                  <Col span={6}>
                    {url && url !== "" && !installed &&
                        <Box align={'flex-end'}>
                          <Button className={'hover-auto'} type={"primary"} onClick={(e) => {
                            e.stopPropagation();
                            this.handleInstall(id, url)
                          }}>{i18n.t('Install')}</Button>
                        </Box>
                    }
                    {installed &&
                        <Box direction={'row'} justify={"flex-end"} align={"center"} style={{ marginLeft: 'auto' }}>
                          <If condition={enabled}>
                            <span className="circle circle-success" />
                            <span className={'font-color-info'}>Enabled</span>
                          </If>
                          <If condition={!enabled}>
                            <span className="circle circle-success" />
                            <span className={'font-color-info'}>Installed</span>
                          </If>
                        </Box>
                    }
                  </Col>
                </Row>
              </Box>
            </Box>
          </Card>
        </a>
      </div>

    )
      ;
  }
}

export default PluginCard;
