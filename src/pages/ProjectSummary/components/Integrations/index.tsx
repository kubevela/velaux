import React, { Component, Fragment } from 'react';
import { Table } from '@b-design/ui';
// import { getIntegrations } from '../../../../api/integration';
import Translation from '../../../../components/Translation';
import locale from '../../../../utils/locale';
import './index.less';

type Props = {};

type State = {
  list: [];
};

class Integrations extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      list: [],
    };
  }

  render() {
    const columns = [
      {
        key: 'name',
        title: <Translation>Alias(Name)</Translation>,
        dataIndex: 'name',
        cell: (v: string, i: number, record: { alias: string; name: string }) => {
          const { alias, name } = record;
          return <span>{`${alias}(${name})`}</span>;
        },
      },
      {
        key: 'type',
        title: <Translation>Type</Translation>,
        dataIndex: 'type',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
      {
        key: 'description',
        title: <Translation>Description</Translation>,
        dataIndex: 'description',
        cell: (v: string) => {
          return <span>{v}</span>;
        },
      },
    ];

    const { Column } = Table;
    const { list } = this.state;
    return (
      <Fragment>
        <div className="integration-wrapper">
          <section className="card-title-wrapper">
            <span className="card-title">
              <Translation>Integrations</Translation>
            </span>
            {/* <Button className='card-button-wrapper'>
                            <Link to='/integration' className='color-setting'><Translation>Add</Translation> </Link>
                        </Button> */}
          </section>
          <section className="card-content-table">
            <Table locale={locale.Table} dataSource={list} hasBorder={true} loading={false}>
              {columns && columns.map((col, key) => <Column {...col} key={key} align={'left'} />)}
            </Table>
          </section>
        </div>
      </Fragment>
    );
  }
}

export default Integrations;
