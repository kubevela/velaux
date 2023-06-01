import { Pagination, Button } from '@alifd/next';
import { connect } from 'dva';
import React from 'react';

import { If } from '../../components/If';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { Env , LoginUserInfo } from '@velaux/data';
import { locale } from '../../utils/locale';

import EnvDialog from './components/EnvDialog';
import TableList from './components/List';

import './index.less';

type Props = {
  envTotal?: number;
  envs: Env[];
  dispatch: ({}) => void;
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
class EnvList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      page: 1,
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
      }
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
    this.setState(
      {
        page,
      },
      () => {
        this.getEnvList();
      }
    );
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
              key={'new-env'}
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
          userInfo={userInfo}
          changeISEdit={(is: boolean, record: Env) => {
            this.changeISEdit(is, record);
          }}
        />

        <Pagination
          className="delivery-target-pagination"
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

export default EnvList;
