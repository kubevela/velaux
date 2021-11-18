import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Grid, Select } from '@b-design/ui';

type Props = {
    cluster: string;
    targetNames: Array<string>
    updateQuery: (cluster: string) => void;
    t: (key: string) => {};
}

class Hearder extends Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    handleChange = (value: string) => {
        this.props.updateQuery(value);
    }

    render() {
        const { Row, Col } = Grid;
        const { t } = this.props;
        const clusterPlacehole = t('Cluster Screening').toString();
        const { targetNames, cluster } = this.props;
        const clusterList = (targetNames || []).map((item: string) => ({
            label: item,
            value: item,
        }));

        return (
            <Row className="boder-radius-8">
                <Col span="6" style={{ padding: '0 8px' }}>
                    <Select
                        mode="single"
                        size="small"
                        onChange={this.handleChange}
                        dataSource={clusterList}
                        placeholder={clusterPlacehole}
                        hasClear
                        value={cluster}
                    />
                </Col>
            </Row>
        )
    }
}


export default withTranslation()(Hearder);
