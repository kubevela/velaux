import React from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from '../../components/SelectSearch/index';
import CardContend from './components/card-conten/index';
import { ADDONS_PATH, WORKFLOWS_PATH } from '../../utils/common';
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
        <Title title="Plug in management" subTitle="Plug in extension" dialogName={ADDONS_PATH} />
        <SelectSearch />
        <CardContend
          cardImg={Img}
          appContent={applicationList}
          path={ADDONS_PATH}
          workFlowPath={WORKFLOWS_PATH}
        />
      </div>
    );
  }
}

export default Addons;
