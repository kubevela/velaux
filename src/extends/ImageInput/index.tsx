
import React from 'react';
import { Input } from '@b-design/ui';
import axios from 'axios';

type DataSource = Array<{ label: string, value: any }>

type Props = {
    url: string,
}

type State = {

};


class ImageInput extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            dataSource: []
        }
    }

    componentDidMount = async () => {
       
    }

    render() {
     
        return <div>
            <Input  />
        </div>;
    }
}

export default ImageInput;