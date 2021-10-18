import React, { Component } from 'react';
import { connect } from 'dva';
import Title from '../../components/ListTitle';
import SelectSearch from '../../components/SelectSearch/index';
import CardContend from './components/card-conten/index';
import { APPLICATION_PATH, WORKFLOWS_PATH } from '../../utils/common';
import '../../common.less';

type Props = {
  dispatch: ({}) => {};
  applicationList: [];
};
type State = {};

@connect((store: any) => {
  return { ...store.application, ...store.cluster };
})
class Application extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    this.getApplication();
  }

  getApplication = async () => {
    this.props.dispatch({
      type: 'application/getApplicationList',
      payload: {},
    });
  };

  render() {
    const { applicationList, dispatch } = this.props;

    return (
      <div>
        <Title
          title="App Manager"
          subTitle="App ManagerSubTitle"
          btnName="Add App"
          dialogName={APPLICATION_PATH}
          dispatch={dispatch}
        />
        <SelectSearch />
        <CardContend
          appContent={applicationList}
          path={APPLICATION_PATH}
          workFlowPath={WORKFLOWS_PATH}
        />
      </div>
    );
  }
}

export default Application;
