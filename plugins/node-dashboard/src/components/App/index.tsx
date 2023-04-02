import * as React from 'react';
import { AppRootProps, Cluster } from '@velaux/data';
import {getBackendSrv,showAlias, locale, Table, Select, Translation} from '@velaux/ui'
import {NodeApi, V1NodeAddress, V1NodeCondition} from '@kubernetes/client-node'
interface State {
  clusters?: Array<Cluster>
  selectCluster?: string
  nodes?: Array<NodeApi>
}
export class App extends React.PureComponent<AppRootProps, State> {
  
  constructor(props: AppRootProps){
    super(props);
    this.state={}
  }

  componentDidMount(){
    this.loadClusters()
  }

  loadClusters = ()=> {
    getBackendSrv().get("/api/v1/clusters").then((res: any)=>{
      if (res) {
        this.setState({clusters: res.clusters}, ()=>{
          this.loadNodes()
        })
      }  
    })
  }
  loadNodes = ()=> {
    const {selectCluster} = this.state
    const clusterName = selectCluster||"local"
    getBackendSrv().get("/proxy/plugins/node-dashboard/api/v1/nodes?cluster="+clusterName).then((res: any)=>{
      if (res) {
        this.setState({nodes: res.items})
      }  
    })
  }
  render() {
    const {clusters, nodes} = this.state
    const clusterOptions = clusters?.map(c=>{
      return {
        label: showAlias(c),
        value: c.name,
      }
    })
    return <div className="page-container">
      <div>
        <span><Translation>Cluster</Translation></span>
        <Select dataSource={clusterOptions} onChange={(v)=>{
        this.setState({selectCluster: v})
      }}>
        </Select>
        </div>
      <div>
        <Table dataSource={nodes} locale={locale().Table}>
          <Table.Column key={"name"} title="Name" dataIndex={"metadata.name"}/>
          <Table.Column key={"ip"} title="Address" dataIndex={"status.addresses"} cell={(address: V1NodeAddress[])=>{
            return address.find(a=>a.type=="InternalIP")?.address
          }}/>
           <Table.Column key={"status"} title="Ready" dataIndex={"status.conditions"} cell={(address: V1NodeCondition[])=>{
            return address.find(a=>a.type=="Ready")?.status
          }}/>
          <Table.Column key={"status"} title="Memory" dataIndex={"status.capacity.memory"} />
          <Table.Column key={"status"} title="CPU" dataIndex={"status.capacity.cpu"} />
        </Table>
      </div>
    </div>;
  }
}
