import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@b-design/ui';
import Translation from '../../components/Translation';
import './index.less';

const LeftMenu = (data, context) => {
  const { location } = data.props;
  const { pathname = '' } = location || {};
  const isApplication = (pathname || '').indexOf('/application') !== -1;
  const isClust = (pathname || '').indexOf('/clust') !== -1;
  const isPlugins = (pathname || '').indexOf('/plugins') !== -1;
  const isOperation = (pathname || '').indexOf('/operation') !== -1;
  const isModel = (pathname || '').indexOf('/model') !== -1;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="slide-wraper">
        <ul className="ul-wraper margin-top-5">
          <li className="first-nav">
            {' '}
            <Translation>Application Center</Translation>{' '}
          </li>
          <li>
            <ul>
              <li>
                <Link to="/" className={isApplication ? 'menu-item-active' : 'menu-item'}>
                  <div className="">
                    <Icon type="layergroup-fill" />
                    <span className={'menu-item-text'}>
                      <Translation>App Manager</Translation>
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </li>
          <li className="first-nav">
            {' '}
            <Translation>Env Integration</Translation>{' '}
          </li>
          <li>
            <ul>
              <li>
                <Link to="/clust" className={isClust ? 'menu-item-active' : 'menu-item'}>
                  <div className="">
                    <Icon type="Directory-tree" />
                    <span className={'menu-item-text'}>
                      <Translation>Cluster Manager</Translation>
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </li>
          <li className="first-nav">
            {' '}
            <Translation>Capability Center</Translation>{' '}
          </li>
          <li>
            <ul>
              <li>
                <Link to="/plugins" className={isPlugins ? 'menu-item-active' : 'menu-item'}>
                  <div>
                    <Icon type="database-set" />
                    <span className={'menu-item-text'}>
                      <Translation>Plugins Manager</Translation>
                    </span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/operation" className={isOperation ? 'menu-item-active' : 'menu-item'}>
                  <div>
                    <Icon type="set" />
                    <span className={'menu-item-text'}>
                      <Translation>Devs Feature</Translation>
                    </span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/model" className={isModel ? 'menu-item-active' : 'menu-item'}>
                  <div>
                    <Icon type="cloud-machine" />
                    <span className={'menu-item-text'}>
                      <Translation>App Model</Translation>
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LeftMenu;
