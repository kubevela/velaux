import React from 'react';
import { connect } from 'dva';
import { Pagination } from '@b-design/ui';
import { listRevisions } from '../../api/application';
import Header from './components/Hearder';
import TableList from './components/List';
import type { ApplicationDetail, EnvBinding, Revisions } from '../../interface/application';
import { statusList } from './constants';
import './index.less';
import locale from '../../utils/locale';

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
  revisionsList: Revisions[];
  revisionsListTotal: number;
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
      page: 0,
      pageSize: 10,
      envName: '',
      status: '',
      revisionsList: [],
      revisionsListTotal: 0,
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
    this.setState({
      page,
      pageSize: 10,
    });
  };

  render() {
    const { revisionsList } = this.state;
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
          getRevisionList={this.getRevisionList}
        />
        <Pagination
          locale={locale.Pagination}
          className="revison-pagenation"
          hideOnlyOnePage={true}
          total={this.state.revisionsListTotal}
          size="small"
          pageSize={this.state.pageSize}
          current={this.state.page}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

export default ApplicationRevisionList;
