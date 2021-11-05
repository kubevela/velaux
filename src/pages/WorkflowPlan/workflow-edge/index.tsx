import React, { Component } from 'react';

import './index.less';

type Props = {
    id: string,
    data?: any
};

type State = {

};

class WorkFlowEdge extends Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {

        };
    }

    componentDidMount() { }


    render() {
       

        return (
            <div className="workflow-edge-container">
                {/* + */}
            </div>
        );
    }
}

export default WorkFlowEdge;
