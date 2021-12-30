import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import { Pagination } from '@b-design/ui';
import ListTitle from '../../components/ListTitle';
import TableList from './components/List';
import EnvDialog from './components/EnvDialog';
import './index.less';
import type { Cluster } from '../../interface/cluster';
import locale from '../../utils/locale';
import { If } from 'tsx-control-statements/components';
import type { Env } from '../../interface/env';
import type { Project } from '../../interface/project';
import type { Target } from '../../interface/target';

type Props = {
  targets?: Target[];
  envTotal?: number;
  envs: Env[];
  clusterList?: Cluster[];
  projects: Project[];
  dispatch: ({}) => void;
  t: (key: string) => string;
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
  return { ...store.target, ...store.application, ...store.env };
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
    this.getProjectList();
    this.getTargetList();
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

  getProjectList = async () => {
    this.props.dispatch({
      type: 'application/getProjectList',
      payload: {},
    });
  };

  getTargetList = async () => {
    this.props.dispatch({
      type: 'target/listTargets',
      payload: {},
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
    const { t, targets, projects, envTotal, envs } = this.props;
    const { visibleEnvDialog, isEdit, envItem } = this.state;
    return (
      <div>
        <ListTitle
          title="Environments"
          subTitle="The environment coordinates the matching relationship between applications and resources."
          addButtonTitle="New Environment"
          addButtonClick={() => {
            this.setState({ visibleEnvDialog: true, envItem: undefined });
          }}
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
          locale={locale.Pagination}
          size="medium"
          pageSize={this.state.pageSize}
          current={this.state.page}
          onChange={this.handleChange}
        />

        <If condition={visibleEnvDialog}>
          <EnvDialog
            t={t}
            visible={visibleEnvDialog}
            targets={targets || []}
            projects={projects || []}
            syncProjectList={this.getProjectList}
            isEdit={isEdit}
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
