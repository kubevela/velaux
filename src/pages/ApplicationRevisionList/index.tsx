import React from 'react';
import { connect } from 'dva';
import { Pagination } from '@b-design/ui';
import { listRevisions } from '../../api/application';
import Header from './components/Hearder';
import TableList from './components/List';
import type {
  ApplicationDetail,
  EnvBinding,
  ApplicationRevision,
} from '../../interface/application';
import { statusList } from './constants';
import './index.less';
import locale from '../../utils/locale';
import { If } from 'tsx-control-statements/components';
import { ShowRevision } from './components/Detail';

type Props = {
  revisions: [];
  applicationDetail?: ApplicationDetail;
  envbinding?: EnvBinding[];
  dispatch: ({}) => {};
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
          revisionsList: res && res.revisions,
          revisionsListTotal: res && res.total,
        });
      }
    });
  };

  updateQuery = (updateQuery: {
    isChangeEnv?: boolean;
    isChangeStatus?: boolean;
    value: string;
  }) => {
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
      },
    );
  };

  showAppModel = (revision: ApplicationRevision) => {
    this.setState({ showAppRevision: true, revision: revision });
  };

  render() {
    const { revisionsList, showAppRevision, revision, appName } = this.state;
    const { envbinding, applicationDetail } = this.props;

    return (
      <div>
        <Header
          envBinding={envbinding}
          statusList={statusList}
          updateQuery={(params: {
            isChangeEnv?: boolean;
            isChangeStatus?: boolean;
            value: string;
          }) => {
            this.updateQuery(params);
          }}
        />
        <TableList
          applicationDetail={applicationDetail}
          list={revisionsList}
          onShowAppModel={this.showAppModel}
          getRevisionList={this.getRevisionList}
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
