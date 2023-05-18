import { Pagination, Button } from '@alifd/next';
import { connect } from 'dva';
import React from 'react';

import { If } from '../../components/If';
import { ListTitle } from '../../components/ListTitle';
import Permission from '../../components/Permission';
import { Translation } from '../../components/Translation';
import type { Cluster , Target , LoginUserInfo } from '@velaux/data';
import { locale } from '../../utils/locale';

import TableList from './components/List';
import TargetDialog from './components/TargetDialog';

import './index.less';

type Props = {
  targets?: [];
  total?: number;
  clusterList?: Cluster[];
  dispatch: ({}) => void;
  userInfo?: LoginUserInfo;
};

type State = {
  page: number;
  pageSize: number;
  query: string;
  showAddTarget: boolean;
  editTargetName: string;
  visibleDelivery: boolean;
  isEdit: boolean;
  targetItem?: Target;
};

@connect((store: any) => {
  return { ...store.target, ...store.clusters, ...store.user };
})
class TargetList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      page: 1,
      pageSize: 5,
      showAddTarget: false,
      editTargetName: '',
      visibleDelivery: false,
      isEdit: false,
    };
  }

  componentDidMount() {
    this.getTargetList();
    this.getClusterList();
  }

  getTargetList = async () => {
    const { page, pageSize, query } = this.state;
    this.props.dispatch({
      type: 'target/listTargets',
      payload: {
        query,
        page,
        pageSize,
      },
    });
  };

  getClusterList = async () => {
    this.props.dispatch({
      type: 'clusters/getClusterList',
    });
  };

  updateTargetList = () => {
    this.setState(
      {
        query: '',
        page: 0,
        pageSize: 10,
      },
      () => {
        this.getTargetList();
      }
    );
  };

  changeISEdit = (isEdit: boolean, record: Target) => {
    this.setState({
      isEdit,
      visibleDelivery: true,
      targetItem: record,
    });
  };

  onClose = () => {
    this.setState({ visibleDelivery: false, isEdit: false });
  };

  onOk = () => {
    this.getTargetList();
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
        this.getTargetList();
      }
    );
  };

  render() {
    const { clusterList, targets, total } = this.props;
    const { visibleDelivery, isEdit, targetItem } = this.state;
    return (
      <div>
        <ListTitle
          title="Targets"
          subTitle="Define the targets that applications would deliver to"
          extButtons={[
            <Permission key={'new-target'} request={{ resource: 'target:*', action: 'create' }} project={''}>
              <Button
                type="primary"
                onClick={() => {
                  this.setState({ visibleDelivery: true, targetItem: undefined });
                }}
              >
                <Translation>New Target</Translation>
              </Button>
              ,
            </Permission>,
          ]}
        />

        <TableList
          list={targets}
          updateTargetList={this.updateTargetList}
          changeISEdit={(is: boolean, record: Target) => {
            this.changeISEdit(is, record);
          }}
        />

        <Pagination
          className="delivery-target-pagination"
          total={total}
          locale={locale().Pagination}
          size="medium"
          pageSize={this.state.pageSize}
          current={this.state.page}
          onChange={this.handleChange}
        />

        <If condition={visibleDelivery}>
          <TargetDialog
            visible={visibleDelivery}
            clusterList={clusterList || []}
            isEdit={isEdit}
            targetItem={targetItem}
            onClose={this.onClose}
            onOK={this.onOk}
          />
        </If>
      </div>
    );
  }
}

export default TargetList;
