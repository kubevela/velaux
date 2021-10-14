import React, { Component } from 'react';
import { Message } from '@b-design/ui';
import Title from './components/app-manager-title/index';
import SelectSearch from '../../components/SelectSearch/index';
import CardContend from '../../components/CardConten/index';
import { getApplications } from '../../api/api';
import { Applications, AppContent } from '../../model/application';
import '../../common.less';

type Props = {};
type State = {
  appContent: AppContent[]
};
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      appContent: []
    }
  }

  componentDidMount() {
    this.getApplication();
  }
  
  getApplication = async () => {
    const res: Applications = await getApplications();
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
      <div>
        <Title />
        <SelectSearch />
        <CardContend appContent={appContent} />
      </div>
    );
  }

}

export default Application;
