import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'dva';
import { Pagination } from '@b-design/ui';
import ListTitle from '../../components/ListTitle';
import TableList from './components/List';
import DeliveryDialog from './components/TargetDialog';
import type { DeliveryTarget } from '../../interface/deliveryTarget';
import './index.less';
import type { Cluster } from '../../interface/cluster';
import locale from '../../utils/locale';
import { If } from 'tsx-control-statements/components';

type Props = {
  deliveryTargets?: [];
  total?: number;
  clusterList?: Cluster[];
  projects?: [];
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
  deliveryTargetItem?: DeliveryTarget;
};

@connect((store: any) => {
  return { ...store.deliveryTarget, ...store.application, ...store.clusters };
})
class DeliveryTargetList extends React.Component<Props, State> {
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
    this.getDeliveryTargetList();
    this.getClusterList();
    this.getProjectList();
  }

  getDeliveryTargetList = async () => {
    const { page, pageSize, query } = this.state;
    this.props.dispatch({
      type: 'deliveryTarget/listDeliveryTarget',
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

  updateDeliveryTargetList = () => {
    this.setState(
      {
        query: '',
        page: 0,
        pageSize: 10,
      },
      () => {
        this.getDeliveryTargetList();
      },
    );
  };

  changeISEdit = (isEdit: boolean, record: DeliveryTarget) => {
    this.setState({
      isEdit,
      visibleDelivery: true,
      deliveryTargetItem: record,
    });
  };

  onClose = () => {
    this.setState({ visibleDelivery: false, isEdit: false });
  };

  onOk = () => {
    this.getDeliveryTargetList();
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
    const { t, clusterList, deliveryTargets, total, projects } = this.props;
    const { visibleDelivery, isEdit, deliveryTargetItem } = this.state;
    return (
      <div>
        <ListTitle
          title="Targets"
          subTitle="Define the targets that applications would deliver to"
          addButtonTitle="New Target"
          addButtonClick={() => {
            this.setState({ visibleDelivery: true, deliveryTargetItem: undefined });
          }}
        />

        <TableList
          list={deliveryTargets}
          updateDeliveryTargetList={this.updateDeliveryTargetList}
          changeISEdit={(is: boolean, record: DeliveryTarget) => {
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
          <DeliveryDialog
            t={t}
            visible={visibleDelivery}
            clusterList={clusterList || []}
            syncProjectList={this.getProjectList}
            projects={projects || []}
            isEdit={isEdit}
            deliveryTargetItem={deliveryTargetItem}
            onClose={this.onClose}
            onOK={this.onOk}
          />
        </If>
      </div>
    );
  }
}

export default withTranslation()(DeliveryTargetList);
