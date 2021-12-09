import React from 'react';
import { Button, Grid, Icon, Select, Input } from '@b-design/ui';
import { withTranslation } from 'react-i18next';
import './index.less';
import Translation from '../../../../components/Translation';
import type { Project } from '../../../../interface/project';
import locale from '../../../../utils/locale';

const { Row, Col } = Grid;

type Props = {
  t: (key: string) => {};
  dispatch: ({}) => {};
  deliveryTargetList?: [];
  projects?: Project[];
  getApplications: (params: any) => void;
};

type State = {
  projectValue: string;
  deliveryTargetValue: string;
  inputValue: string;
};

class SelectSearch extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      projectValue: '',
      deliveryTargetValue: '',
      inputValue: '',
    };
    this.handleChangeProject = this.handleChangeProject.bind(this);
    this.handleChangDeliveryTarget = this.handleChangDeliveryTarget.bind(this);
    this.handleChangName = this.handleChangName.bind(this);
  }

  handleChangeProject(e: string) {
    this.setState(
      {
        projectValue: e,
      },
      () => {
        this.getApplications();
      },
    );
  }

  handleChangDeliveryTarget(e: string) {
    this.setState(
      {
        deliveryTargetValue: e,
      },
      () => {
        this.getApplications();
      },
    );
  }

  handleChangName(e: string) {
    this.setState({
      inputValue: e,
    });
  }

  handleClickSearch = () => {
    this.getApplications();
  };

  getApplications = async () => {
    const { projectValue, deliveryTargetValue, inputValue } = this.state;
    const params = {
      project: projectValue,
      targetName: deliveryTargetValue,
      query: inputValue,
    };
    this.props.getApplications(params);
  };

  render() {
    const { deliveryTargetList, projects, t } = this.props;
    const { projectValue, deliveryTargetValue, inputValue } = this.state;

    const projectPlacehole = t('Search by project').toString();
    const deliveryTargetPlacehole = t('Search by target').toString();
    const appPlacehole = t('Search by application name and description').toString();
    const projectSource = projects?.map((item) => {
      return {
        label: item.alias || item.name,
        value: item.name,
      };
    });
    return (
      <Row className="app-select-wraper boder-radius-8">
        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            locale={locale.Select}
            mode="single"
            size="large"
            onChange={this.handleChangeProject}
            dataSource={projectSource}
            placeholder={projectPlacehole}
            className="item"
            hasClear
            value={projectValue}
          />
        </Col>

        <Col span="6" style={{ padding: '0 8px' }}>
          <Select
            locale={locale.Select}
            mode="single"
            size="large"
            onChange={this.handleChangDeliveryTarget}
            dataSource={deliveryTargetList}
            placeholder={deliveryTargetPlacehole}
            className="item"
            hasClear
            value={deliveryTargetValue}
          />
        </Col>

        <Col span="6" style={{ padding: '0 8px' }}>
          <Input
            innerAfter={
              <Icon
                type="search"
                size="xs"
                onClick={this.handleClickSearch}
                style={{ margin: 4 }}
              />
            }
            hasClear
            placeholder={appPlacehole}
            onChange={this.handleChangName}
            onPressEnter={this.handleClickSearch}
            value={inputValue}
            className="item"
          />
        </Col>
        <Col span="3" style={{ paddingTop: '20px' }}>
          <Button
            type="secondary"
            onClick={() => {
              this.setState(
                {
                  projectValue: '',
                  deliveryTargetValue: '',
                  inputValue: '',
                },
                () => {
                  this.handleClickSearch();
                },
              );
            }}
          >
            <Translation>Clear</Translation>
          </Button>
        </Col>
      </Row>
    );
  }
}

export default withTranslation()(SelectSearch);
