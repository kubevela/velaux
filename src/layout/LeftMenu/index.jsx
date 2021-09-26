import React from "react";
import { Link } from "react-router-dom";
import { Icon } from '@b-design/ui';
import "./index.less";

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
      <div className='slide-wraper'>
        <ul className='ul-wraper'>
          <li className='first-nav'> 应用中心 </li>
          <li>
            <ul>
              <li>
                <Link to="/" className={isApplication ? "menu-item-active" : "menu-item"}>
                  <div className=''>
                    <Icon type="layergroup-fill" />
                    <span
                      className={"menu-item-text"}
                    >
                      应用管理
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </li>
          <li className='first-nav'> 环境集成 </li>
          <li>
            <ul>
              <li>
                <Link to="/clust" className={isClust ? "menu-item-active" : "menu-item"}>
                  <div className=''>
                    <Icon type="Directory-tree" />
                    <span
                      className={"menu-item-text"}
                    >
                      集群管理
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </li>
          <li className='first-nav'> 能力中心</li>
          <li>
            <ul>
              <li>
                <Link to="/plugins" className={isPlugins ? "menu-item-active" : "menu-item"}>
                  <div>
                    <Icon type="database-set" />
                    <span
                      className={"menu-item-text"}
                    >
                      插件管理
                    </span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/operation" className={isOperation ? "menu-item-active" : "menu-item"}>
                  <div>
                    <Icon type="set" />
                    <span
                      className={"menu-item-text"}
                    >
                      运维特征
                    </span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/model" className={isModel ? "menu-item-active" : "menu-item"}>
                  <div>
                    <Icon type="cloud-machine" />
                    <span
                      className={"menu-item-text"}
                    >
                      应用模型
                    </span>
                  </div>
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div >
    </div >
  );
};

export default LeftMenu
