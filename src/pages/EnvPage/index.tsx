import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import { Pagination, Button } from '@b-design/ui';
import ListTitle from '../../components/ListTitle';
import TableList from './components/List';
import EnvDialog from './components/EnvDialog';
import './index.less';
import type { Cluster } from '../../interface/cluster';
import locale from '../../utils/locale';
import { If } from 'tsx-control-statements/components';
import type { Env } from '../../interface/env';
import type { LoginUserInfo } from '../../interface/user';
import Permission from '../../components/Permission';
import Translation from '../../components/Translation';

type Props = {
  envTotal?: number;
  envs: Env[];
  clusterList?: Cluster[];
  dispatch: ({}) => void;
  t: (key: string) => string;
  userInfo?: LoginUserInfo;
};

type State = {
  page: number;
  pageSize: number;
  showAddTarget: boolean;
  editTargetName: string;
  visibleEnvDialog: boolean;
  isEdit: boolean;
  envItem?: Env;
};

@connect((store: any) => {
  return { ...store.target, ...store.application, ...store.env, ...store.user };
})
class targetList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      page: 0,
      pageSize: 10,
      showAddTarget: false,
      editTargetName: '',
      visibleEnvDialog: false,
      isEdit: false,
    };
  }

  componentDidMount() {
    this.getEnvList();
  }

  getEnvList = async () => {
    const { page, pageSize } = this.state;
    this.props.dispatch({
      type: 'env/listEnvs',
      payload: {
        page,
        pageSize,
      },
    });
  };

  updateEnvList = () => {
    this.setState(
      {
        page: 0,
        pageSize: 10,
      },
      () => {
        this.getEnvList();
      },
    );
  };

  changeISEdit = (isEdit: boolean, record: Env) => {
    this.setState({
      isEdit,
      visibleEnvDialog: true,
      envItem: record,
    });
  };

  onClose = () => {
    this.setState({ visibleEnvDialog: false, isEdit: false });
  };

  onOk = () => {
    this.getEnvList();
    this.setState({
      isEdit: false,
    });
  };

  handleChange = (page: number) => {
    this.setState({
      page,
      pageSize: 10,
    });
  };

  render() {
    const { envTotal, envs, userInfo } = this.props;
    const { visibleEnvDialog, isEdit, envItem } = this.state;
    return (
      <div>
        <ListTitle
          title="Environments"
          subTitle="Set up the Environments for your Application based on Target sources"
          extButtons={[
            <Permission
              request={{ resource: 'project:?/environment:*', action: 'create' }}
              project={'?'}
            >
              <Button
                type="primary"
                onClick={() => {
                  this.setState({ visibleEnvDialog: true, envItem: undefined });
                }}
              >
                <Translation>New Environment</Translation>
              </Button>
              ,
            </Permission>,
          ]}
        />

        <TableList
          list={envs || []}
          updateEnvList={this.updateEnvList}
          changeISEdit={(is: boolean, record: Env) => {
            this.changeISEdit(is, record);
          }}
        />

        <Pagination
          className="delivery-target-pagenation"
          total={envTotal}
          locale={locale().Pagination}
          size="medium"
          pageSize={this.state.pageSize}
          current={this.state.page}
          onChange={this.handleChange}
        />

        <If condition={visibleEnvDialog}>
          <EnvDialog
            visible={visibleEnvDialog}
            projects={userInfo?.projects || []}
            isEdit={isEdit}
            userInfo={userInfo}
            envItem={envItem}
            onClose={this.onClose}
            onOK={this.onOk}
          />
        </If>
      </div>
    );
  }
}

export default withTranslation()(targetList);
