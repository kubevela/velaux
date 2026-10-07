import { Input } from '@alifd/next';
import { Link } from 'dva/router';
import React, { useEffect, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { BsBoxSeam } from 'react-icons/bs';

import type { PackageBase } from '@velaux/data';
import { listPackages } from '../../api/package';
import Empty from '../../components/Empty';
import { ListTitle } from '../../components/ListTitle';
import '../../components/RowList';
import { Translation } from '../../components/Translation';
import i18n from '../../i18n';
import type { PackageSource } from './packages';
import { filterPackages, packageLink } from './packages';
import './index.less';

// ProviderPill says what runs a package's functions: an external provider by
// its protocol (its endpoint on hover), CueX for a package of CUE alone, or
// KubeVela for one built in.
const ProviderPill = (props: { pkg: PackageBase }) => {
  const { pkg } = props;
  if (pkg.provider) {
    return (
      <span className="provider-pill external" title={pkg.provider.endpoint}>
        {pkg.provider.protocol.toUpperCase()}
      </span>
    );
  }
  if (pkg.builtin) {
    return (
      <span className="provider-pill builtin" title={i18n.t('Runs in KubeVela').toString()}>
        KubeVela
      </span>
    );
  }
  return (
    <span className="provider-pill cuex" title={i18n.t('CUE only, no provider').toString()}>
      CueX
    </span>
  );
};

// Packages lists the CUE packages a definition can import: the Package resources
// in the cluster, then those built into KubeVela.
const Packages = () => {
  const [packages, setPackages] = useState<PackageBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<PackageSource>('all');
  useEffect(() => {
    listPackages()
      .then((res: any) => setPackages(res?.packages || []))
      .finally(() => setLoading(false));
  }, []);
  const shown = filterPackages(packages, query, source);
  return (
    <div className="packages">
      <ListTitle title="Packages" subTitle="The CUE packages definitions can import, and the functions they offer" />
      <div className="packages-toolbar">
        <Input
          innerBefore={<AiOutlineSearch className="packages-search-icon" />}
          hasClear
          placeholder={i18n.t('Search by name or path').toString()}
          value={query}
          onChange={(v) => setQuery(v)}
          className="packages-search"
        />
        <div className="packages-source" role="group" aria-label="Source">
          {(['all', 'cluster', 'builtin'] as PackageSource[]).map((s) => (
            <button
              key={s}
              type="button"
              className={source === s ? 'active' : ''}
              aria-pressed={source === s}
              onClick={() => setSource(s)}
            >
              <Translation>{s === 'all' ? 'All' : s === 'cluster' ? 'Custom' : 'Built-in'}</Translation>
            </button>
          ))}
        </div>
      </div>
      {!loading && shown.length === 0 ? (
        <Empty message={<Translation>No packages</Translation>} />
      ) : (
        <div className="row-list package-list">
          <div className="row-list-head">
            <span>
              <Translation>Name</Translation>
            </span>
            <span>
              <Translation>Import path</Translation>
            </span>
            <span>
              <Translation>Provider</Translation>
            </span>
            <span>
              <Translation>Functions</Translation>
            </span>
          </div>
          {shown.map((p) => (
            <div key={packageLink(p)} className="row-list-row">
              <div className="row-list-main">
                <Link className="row-list-name" to={packageLink(p)}>
                  <BsBoxSeam className="row-list-icon" />
                  <span>
                    <span className="row-list-title">{p.name}</span>
                    <span className="row-list-type">
                      {p.builtin ? (
                        <span>
                          <Translation>Built-in</Translation>
                          {p.usedBy && p.usedBy.length > 0 && (
                            <span>
                              {' · '}
                              {p.usedBy.map((u) => i18n.t(u)).join(', ')}
                            </span>
                          )}
                        </span>
                      ) : (
                        p.namespace
                      )}
                    </span>
                  </span>
                </Link>
                <span>
                  <code className="row-list-code">{p.path}</code>
                </span>
                <span>
                  <ProviderPill pkg={p} />
                </span>
                <span>{p.functions}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Packages;
