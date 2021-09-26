import React, { useState, Component } from 'react';
import { Button, Message, Grid, Search, Icon, Select, Tab } from '@b-design/ui';
import Translation from '../../components/translation';
import {
    addClust,
    clustGroup,
    clustTitle,
    clustSubTitle
} from '../../constants/application';
import './index.less';;

class TabsContent extends Component {
    handleChange = (key:string | number) => {
        console.log(key)
      }
    render() {
        return (
            <div className='tabs-content'>
                <Tab shape="wrapped" size="small" onChange={this.handleChange}>
                    <Tab.Item title="Home">Home content</Tab.Item>
                    <Tab.Item title="Documentation">Doc content</Tab.Item>
                    <Tab.Item title="Help">Help Content</Tab.Item>
                </Tab>
            </div>
        )
    }
}

export default TabsContent;