import React from 'react';
import { Dialog, Grid, Button, Loading } from '@b-design/ui';
import { addonDetail } from '../../../../constants';
import { If } from 'tsx-control-statements/components';
import {
  getAddonsDetails,
  getAddonsStatus,
  disableAddon,
  enableAddon,
} from '../../../../api/addons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.less';

type Props = {
  visible: boolean;
  addonName: string;
  onClose: () => void;
  dispatch: ({}) => {};
};

type State = {
  addonDetailInfo: {
    name: string;
    detail: string;
  };
  loading: boolean;
  status: 'disabled' | 'enabled' | '';
  statusLoading: boolean;
};

class AddonDetailDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      addonDetailInfo: {
        name: '',
        detail: '',
      },
      status: '',
      loading: true,
      statusLoading: false,
    };
  }

  componentDidMount() {
    this.loadAddonDetail();
    this.loadAddonStatus();
  }

  loadAddonDetail = async () => {
    getAddonsDetails({ name: this.props.addonName })
      .then((res) => {
        this.setState({ addonDetailInfo: res ? res : {}, loading: false });
      })
      .finally(() => {
        this.setState({ loading: false });
      });
  };

  loadAddonStatus = async () => {
    getAddonsStatus({ name: this.props.addonName }).then((res) => {
      if (res) {
        this.setState({ status: res.phase, statusLoading: false });
      }
    });
  };

  enableAddon = async () => {
    this.setState({ statusLoading: true }, () => {
      enableAddon({ name: this.props.addonName }).then((res) => {
        this.loadAddonStatus();
      });
    });
  };

  disableAddon = async () => {
    this.setState({ statusLoading: true }, () => {
      disableAddon({ name: this.props.addonName }).then((res) => {
        this.loadAddonStatus();
      });
    });
  };

  onClose = () => {
    this.props.onClose();
  };

  render() {
    const { visible } = this.props;
    const { loading, addonDetailInfo, status, statusLoading } = this.state;
    const { Row, Col } = Grid;
    return (
      <div className="basic">
        <Dialog
          className="dialog-detail-addon"
          title={addonDetailInfo.name ? addonDetailInfo.name : addonDetail}
          visible={visible}
          onCancel={this.onClose}
          onClose={this.onClose}
          footerActions={[]}
          footerAlign="center"
        >
          <div className="basic">
            <Loading visible={loading} />
            <Row>
              <Col span={12}>
                <div>
                  <span>启用状态：</span>
                  <span>{status}</span>
                </div>
              </Col>
              <Col span={12}>
                <If condition={status === 'disabled'}>
                  <Button
                    loading={statusLoading}
                    style={{ float: 'right' }}
                    size="small"
                    type="secondary"
                    onClick={this.enableAddon}
                  >
                    启用
                  </Button>
                </If>
                <If condition={status == 'enabled'}>
                  <Button
                    loading={statusLoading}
                    style={{ float: 'right' }}
                    size="small"
                    type="secondary"
                    onClick={this.disableAddon}
                  >
                    禁用
                  </Button>
                </If>
              </Col>
            </Row>
          </div>
          <div className="next-menu-divider"></div>
          <If condition={addonDetailInfo.detail}>
            <ReactMarkdown
              children={addonDetailInfo.detail}
              remarkPlugins={[remarkGfm]}
            ></ReactMarkdown>
          </If>
          <If condition={!addonDetailInfo.detail}>
            <div className="readme-empty">
              <span>暂无Readme介绍</span>
            </div>
          </If>
        </Dialog>
      </div>
    );
  }
}

export default AddonDetailDialog;
