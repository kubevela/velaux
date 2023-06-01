import React from 'react';
import { Input, Form, Loading, Grid, Tag } from '@alifd/next';
import './index.less';

import type { InputProps } from '@alifd/next/types/input';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { AiOutlineHdd, AiOutlineExport } from 'react-icons/ai';
import { TbBrandDocker } from 'react-icons/tb';

import { getImageInfo } from '../../api/repository';
import dockerLogo from '../../assets/docker.svg';
import { If } from '../../components/If';
import type { ImageInfo } from '@velaux/data';
import { beautifyTime, beautifyBinarySize } from '../../utils/common';
import ImageSecretSelect from '../ImageSecretSelect';
const { Col, Row } = Grid;

interface Props extends InputProps {
  value?: any;
  key: string;
  id: string;
  label: string;
  required: boolean;
  onChange: (value: any) => void;
  disabled: boolean;
  project?: string;
  secretValue?: any;
  onSecretChange: (value?: string[]) => void;
  secretID: string;
}

type State = {
  imageInfo?: ImageInfo;
  imageName: string;
  loading: boolean;
};

@connect((store: any) => {
  return { ...store.uischema };
})
class ImageInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      imageName: '',
      loading: false,
    };
  }

  componentDidMount = async () => {};

  loadImageInfo = () => {
    const { project, onChange, onSecretChange } = this.props;
    const { imageName } = this.state;
    if (project && imageName) {
      onChange(imageName);
      this.setState({ loading: true });
      getImageInfo({ project: project, name: imageName })
        .then((res: ImageInfo) => {
          if (res) {
            this.setState({ imageInfo: res });
            if (res.secretNames) {
              onSecretChange(res.secretNames);
            } else {
              onSecretChange(undefined);
            }
          }
        })
        .finally(() => {
          this.setState({ loading: false });
        });
    }
  };

  render() {
    const { value, id, required, label, key, onSecretChange, secretValue, disabled, secretID } =
      this.props;
    const { loading, imageInfo } = this.state;
    if (!this.state.imageName && value) {
      this.setState({ imageName: value }, () => {
        this.loadImageInfo();
      });
    }
    let secrets = secretValue;
    let secretDisabled = disabled;
    if (imageInfo && imageInfo.secretNames) {
      secrets = imageInfo.secretNames;
      secretDisabled = true;
    }
    return (
      <div>
        <Row>
          <Col span={16} style={{ padding: '0 16px 0 0' }}>
            <Form.Item
              required={required}
              label={label}
              key={key}
              help={
                <span>
                  To deploy from a private registry, you need to{' '}
                  <Link to="/configs/config-image-registry/config">
                    create a config configuration
                  </Link>
                </span>
              }
            >
              <Input
                id={id}
                onChange={(name: string) => {
                  this.setState({ imageName: name });
                }}
                disabled={disabled}
                defaultValue={value}
                onBlur={this.loadImageInfo}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={'Secret'}>
              <ImageSecretSelect
                id={secretID}
                disabled={secretDisabled}
                onChange={onSecretChange}
                value={secrets}
              />
            </Form.Item>
          </Col>
        </Row>

        <Loading visible={loading} style={{ width: '100%' }}>
          <If condition={imageInfo}>
            <div className="image-info">
              <If condition={imageInfo?.info}>
                <Row>
                  <Col xl={24} className="container-base">
                    <img className="docker-logo" src={dockerLogo} />
                    <div className="docker-base">
                      <div>
                        <span className="name">{imageInfo?.name}</span>
                      </div>
                      <div className="desc">
                        <span title={imageInfo?.info?.created}>
                          {beautifyTime(imageInfo?.info?.created)}
                        </span>
                        <span style={{ marginLeft: '8px' }}>
                          {beautifyBinarySize(imageInfo?.size || 0)}
                        </span>
                        <If condition={imageInfo?.info?.architecture}>
                          <span style={{ marginLeft: '8px' }}>{imageInfo?.info?.architecture}</span>
                        </If>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col className="image-item" xl={8}>
                    <div className="image-item-icon">
                      <AiOutlineHdd title="Volume" />
                    </div>
                    <div className="name">
                      {imageInfo?.info?.config?.Volumes
                        ? Object.keys(imageInfo?.info?.config?.Volumes).map((path) => {
                            return <Tag color="green">{path}</Tag>;
                          })
                        : 'No default Volume config'}
                    </div>
                  </Col>
                  <Col className="image-item" xl={8}>
                    <div className="image-item-icon">
                      <AiOutlineExport title="ExposedPorts" />
                    </div>
                    <div className="name">
                      {imageInfo?.info?.config?.ExposedPorts
                        ? Object.keys(imageInfo?.info?.config?.ExposedPorts).map((port) => {
                            return <Tag color="blue">{port}</Tag>;
                          })
                        : 'No default Port config'}
                    </div>
                  </Col>
                  <Col className="image-item" xl={8}>
                    <div className="image-item-icon">
                      <TbBrandDocker />
                    </div>
                    <div className="name">
                      <Tag title={imageInfo?.registry}>{imageInfo?.registry}</Tag>
                    </div>
                  </Col>
                </Row>
              </If>
              <If condition={imageInfo?.message}>
                <div className="message">{imageInfo?.message}</div>
              </If>
            </div>
          </If>
        </Loading>
      </div>
    );
  }
}

export default ImageInput;
