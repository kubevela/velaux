import * as React from 'react';
import { AppRootProps, Cluster } from '@velaux/data';
import { getBackendSrv, showAlias, locale, Table, Select, ListTitle, Grid, Form } from '@velaux/ui';
import { NodeApi, V1NodeAddress, V1NodeCondition } from '@kubernetes/client-node';
import './index.less';

const { Row, Col } = Grid;
interface State {
  clusters?: Array<Cluster>;
  selectCluster?: string;
  nodes?: Array<NodeApi>;
}
export class App extends React.PureComponent<AppRootProps, State> {
  constructor(props: AppRootProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.loadClusters();
  }

  loadClusters = () => {
    getBackendSrv()
      .get('/api/v1/clusters')
      .then((res: any) => {
        if (res) {
          const defaultCluster =
            Array.isArray(res.clusters) && res.clusters.length > 0 ? res.clusters[0].name : 'local';
          this.setState({ clusters: res.clusters, selectCluster: defaultCluster }, () => {
            this.loadNodes();
          });
        }
      });
  };
  loadNodes = () => {
    const { selectCluster } = this.state;
    const clusterName = selectCluster || 'local';
    getBackendSrv()
      .get('/proxy/plugins/node-dashboard/api/v1/nodes', {
        params: {
          cluster: clusterName,
        },
      })
      .then((res: any) => {
        if (res) {
          this.setState({ nodes: res.items || [] });
        } else {
          this.setState({ nodes: [] });
        }
      });
  };

  onChangeCluster = (c: string) => {
    this.setState({ selectCluster: c }, this.loadNodes);
  };

  render() {
    const { clusters, nodes, selectCluster } = this.state;
    const clusterOptions = clusters?.map((c) => {
      return {
        label: showAlias(c),
        value: c.name,
      };
    });
    return (
      <div className="page-container">
        <ListTitle title="Node Management" subTitle="" />
        <Row>
          <Col span={6}>
            <div className="cluster-select">
              <Form.Item label="Cluster" labelAlign="left">
                <Select
                  locale={locale().Select}
                  dataSource={clusterOptions}
                  value={selectCluster}
                  onChange={this.onChangeCluster}
                ></Select>
              </Form.Item>
            </div>
          </Col>
        </Row>
        <div>
          <Table dataSource={nodes} locale={locale().Table}>
            <Table.Column key={'name'} title="Name" dataIndex={'metadata.name'} />
            <Table.Column
              key={'ip'}
              title="Address"
              dataIndex={'status.addresses'}
              cell={(address: V1NodeAddress[]) => {
                return address.find((a) => a.type == 'InternalIP')?.address;
              }}
            />
            <Table.Column
              key={'status'}
              title="Ready"
              dataIndex={'status.conditions'}
              cell={(address: V1NodeCondition[]) => {
                return address.find((a) => a.type == 'Ready')?.status;
              }}
            />
            <Table.Column key={'status'} title="Memory" dataIndex={'status.capacity.memory'} />
            <Table.Column key={'status'} title="CPU" dataIndex={'status.capacity.cpu'} />
          </Table>
        </div>
      </div>
    );
  }
}
