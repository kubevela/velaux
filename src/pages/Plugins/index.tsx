import React from 'react';
import { connect } from 'dva';
import Title from './components/plugin-title/index';
import SelectSearch from '../../components/SelectSearch/index';
import CardContend from '../../components/CardConten/index';
import Img from '../../assets/plugins.png';

type Props = {
  dispatch: ({}) => {};
  applicationList: [];
  defaultCluster: string;
};

type State = {};

@connect((store: any) => {
  const list = [...store.application.applicationList];
  return { ...store.addons, ...{ applicationList: list } };
})
class Addons extends React.Component<Props, State> {
  render() {
    const { applicationList } = this.props;
    return (
      <div>
        <Title />
        <SelectSearch />
        <CardContend cardImg={Img} appContent={applicationList} />
      </div>
    );
  }
}

export default Addons;
