import React from 'react';
import Title from './components/clust-title/index';
import SelectSearch from './components/clust-select-search/index';
import CardContend from '../../components/CardConten/index';
import { Message } from '@b-design/ui';
import { Clusters, AppContent } from '../../model/cluster';
import { getClusters } from '../../api/api';
import Img from '../../assets/clust-cloud.png';

type Props = {};
type State = {
  appContent: AppContent[]
};
class Clust extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      appContent: []
    }
  }

  componentDidMount() {
    this.getClusters();
  }

  getClusters = async () => {
    const res: Clusters = await getClusters();
    if (res.code === 200) {
      const { applications } = res.data || [];
      const appContent: AppContent[] = [];
      for (const item of applications) {
        const app = {
          "name": item.name,
          "status": item.status,
          "icon": item.icon,
          "description": item.description,
          "createTime": item.createTime,
          "btnContent": item.btnContent,
          "href": item.description
        };
        appContent.push(app);
      }
      this.setState({
        appContent: appContent
      })
    } else {
      Message.error(res.msg);
    }
  };

  render() {
    const { appContent } = this.state;
    return (
      <>
        <div>
          <Title />
          <SelectSearch />
          <CardContend
            cardImg={Img}
            appContent={appContent}
          />
        </div>
      </>
    );
  }
}

export default Clust;
