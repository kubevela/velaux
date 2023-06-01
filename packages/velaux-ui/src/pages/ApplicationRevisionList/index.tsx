import { Pagination } from '@alifd/next';
import { connect } from 'dva';
import React from 'react';
import type { Dispatch } from 'redux';

import { listRevisions } from '../../api/application';
import { If } from '../../components/If';
import type { ApplicationDetail, EnvBinding, ApplicationRevision } from '@velaux/data';
import { locale } from '../../utils/locale';

import { ShowRevision } from './components/Detail';
import Header from './components/Header';
import TableList from './components/List';
import { statusList } from './constants';

import './index.less';

type Props = {
  revisions: [];
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
  dispatch: Dispatch<any>;
  match: {
    params: {
      appName: string;
    };
  };
};

type State = {
  appName: string;
  page: number;
  pageSize: number;
  envName: string;
  status: string;
  revisionsList: ApplicationRevision[];
  revisionsListTotal: number;
  showAppRevision: boolean;
  revision?: ApplicationRevision;
};

@connect((store: any) => {
  return { ...store.application };
})
class ApplicationRevisionList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { params } = props.match;
    this.state = {
      appName: params.appName,
      page: 1,
      pageSize: 10,
      envName: '',
      status: '',
      revisionsList: [],
      revisionsListTotal: 0,
      showAppRevision: false,
    };
  }

  componentDidMount() {
    this.getRevisionList();
  }

  getRevisionList = async () => {
    const { appName, page, pageSize, envName, status } = this.state;
    const params = {
      appName,
      envName,
      status,
      page,
      pageSize,
    };

    listRevisions(params).then((res) => {
      if (res) {
        this.setState({
          revisionsList: res.revisions || [],
          revisionsListTotal: res.total || 0,
        });
      }
    });
  };

  updateQuery = (updateQuery: { isChangeEnv?: boolean; isChangeStatus?: boolean; value: string }) => {
    const { isChangeEnv, isChangeStatus, value } = updateQuery;
    if (isChangeEnv) {
      this.setState({ envName: value }, () => {
        this.getRevisionList();
      });
    } else if (isChangeStatus) {
      this.setState({ status: value }, () => {
        this.getRevisionList();
      });
    }
  };

  handleChange = (page: number) => {
    this.setState(
      {
        page,
      },
      () => {
        this.getRevisionList();
      }
    );
  };

  showAppModel = (revision: ApplicationRevision) => {
    this.setState({ showAppRevision: true, revision: revision });
  };

  render() {
    const { revisionsList, showAppRevision, revision, appName } = this.state;
    const { envbinding, applicationDetail, dispatch } = this.props;

    return (
      <div>
        <Header
          envBinding={envbinding}
          statusList={statusList}
          updateQuery={(params: { isChangeEnv?: boolean; isChangeStatus?: boolean; value: string }) => {
            this.updateQuery(params);
          }}
        />
        <TableList
          applicationDetail={applicationDetail}
          list={revisionsList}
          onShowAppModel={this.showAppModel}
          getRevisionList={this.getRevisionList}
          dispatch={dispatch}
        />
        <Pagination
          locale={locale().Pagination}
          className="revision-pagination text-align-right"
          total={this.state.revisionsListTotal}
          pageSize={this.state.pageSize}
          current={this.state.page}
          onChange={this.handleChange}
        />
        <If condition={showAppRevision}>
          {revision && (
            <ShowRevision
              onClose={() => {
                this.setState({ showAppRevision: false, revision: undefined });
              }}
              appName={appName}
              revision={revision}
            />
          )}
        </If>
      </div>
    );
  }
}

export default ApplicationRevisionList;
