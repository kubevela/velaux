import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import { Pagination } from '@b-design/ui';
import ListTitle from '../../components/ListTitle';
import TableList from './components/List';
import TargetDialog from './components/TargetDialog';
import type { Target } from '../../interface/target';
import './index.less';
import type { Cluster } from '../../interface/cluster';
import locale from '../../utils/locale';
import { If } from 'tsx-control-statements/components';

type Props = {
  targets?: [];
  total?: number;
  clusterList?: Cluster[];
  dispatch: ({}) => void;
  t: (key: string) => string;
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
  return { ...store.target, ...store.clusters };
})
class targetList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      page: 0,
      pageSize: 10,
      showAddTarget: false,
      editTargetName: '',
      visibleDelivery: false,
      isEdit: false,
    };
  }

  componentDidMount() {
    this.getTargetList();
    this.getClusterList();
    this.getProjectList();
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

  getProjectList = async () => {
    this.props.dispatch({
      type: 'application/getProjectList',
      payload: {},
    });
  };

  updatetargetList = () => {
    this.setState(
      {
        query: '',
        page: 0,
        pageSize: 10,
      },
      () => {
        this.getTargetList();
      },
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
    this.setState({
      page,
      pageSize: 10,
    });
  };

  render() {
    const { t, clusterList, targets, total } = this.props;
    const { visibleDelivery, isEdit, targetItem } = this.state;
    return (
      <div>
        <ListTitle
          title="Targets"
          subTitle="Define the targets that applications would deliver to"
          addButtonTitle="New Target"
          addButtonClick={() => {
            this.setState({ visibleDelivery: true, targetItem: undefined });
          }}
        />

        <TableList
          list={targets}
          updatetargetList={this.updatetargetList}
          changeISEdit={(is: boolean, record: Target) => {
            this.changeISEdit(is, record);
          }}
        />

        <Pagination
          className="delivery-target-pagenation"
          total={total}
          locale={locale.Pagination}
          size="medium"
          pageSize={this.state.pageSize}
          current={this.state.page}
          onChange={this.handleChange}
        />

        <If condition={visibleDelivery}>
          <TargetDialog
            t={t}
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

export default withTranslation()(targetList);
