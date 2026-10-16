import { connect } from 'dva';
import React from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import type { LoginUserInfo } from '@velaux/data';

import { getApplicationList } from '../../api/application';
import { listTemplates } from '../../api/config';
import { getDefinitionsList } from '../../api/definitions';
import { getEnvs } from '../../api/env';
import { getProjectList } from '../../api/project';
import { getTarget } from '../../api/target';
import { definitionPlaceQuery } from '../../utils/definitionPlace';
import i18n from '../../i18n';
import { locationService } from '../../services/LocationService';
import { menuService } from '../../services/MenuService';
import type { SearchItem } from './search';
import { addRecent, isQuickSearchKey, matchItems, recentFromPath } from './search';
import './index.less';

// recentGroup heads what was opened recently, shown before anything is typed.
const recentGroup = 'Recent';

const groups = ['Pages', 'Applications', 'Projects', 'Environments', 'Targets', 'Definitions', 'Configs'];
const definitionTypes: Array<'component' | 'trait' | 'policy' | 'workflowstep'> = [
  'component',
  'trait',
  'policy',
  'workflowstep',
];

type Props = {
  userInfo?: LoginUserInfo;
  currentProject?: { current: string; resolved: boolean };
};

type State = {
  open: boolean;
  query: string;
  items: SearchItem[];
  active: number;
  recent: SearchItem[];
};

// recentKey keeps what this browser opened recently, a convenience for its user
// alone; reading or writing it may fail, and the search works without it.
const recentKey = 'velaux-quick-search-recent';

function loadRecent(): SearchItem[] {
  try {
    const raw = window.localStorage.getItem(recentKey);
    return raw ? (JSON.parse(raw) as SearchItem[]) : [];
  } catch (e) {
    return [];
  }
}

function saveRecent(list: SearchItem[]) {
  try {
    window.localStorage.setItem(recentKey, JSON.stringify(list));
  } catch (e) {
    // Storage may be full or blocked; the list lasts the session.
  }
}

// QuickSearch is the search bar across the top of the page and the palette it
// opens, also on Cmd+K or Ctrl+K: pages, applications, projects, environments,
// targets, definitions and config templates, read once when it first opens.
// With nothing typed it offers what was opened recently first.
class QuickSearch extends React.Component<Props, State> {
  // loaded is the project the index was loaded for; definitions differ by it.
  loaded?: string;
  input = React.createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);
    this.state = { open: false, query: '', items: [], active: 0, recent: loadRecent() };
  }

  unlisten?: () => void;

  remember = (item?: SearchItem) => {
    if (!item) {
      return;
    }
    const recent = addRecent(this.state.recent, item);
    saveRecent(recent);
    this.setState({ recent });
  };

  componentDidMount() {
    window.addEventListener('keydown', this.onGlobalKey);
    const history = locationService.getHistory();
    this.remember(recentFromPath(history.location.pathname));
    this.unlisten = history.listen((location) => this.remember(recentFromPath(location.pathname)));
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onGlobalKey);
    this.unlisten?.();
  }

  onGlobalKey = (e: KeyboardEvent) => {
    if (isQuickSearchKey(e)) {
      e.preventDefault();
      if (this.state.open) {
        this.close();
      } else {
        this.open();
      }
    }
  };

  // project is the one picked in the top bar, whose own definitions are found.
  project = () => (this.props.currentProject?.resolved ? this.props.currentProject.current : '');

  open = () => {
    this.setState({ open: true, query: '', active: 0 }, () => this.input.current?.focus());
    const project = this.project();
    if (this.loaded !== project) {
      this.loaded = project;
      this.setState({ items: [] });
      this.load();
    }
  };

  close = () => {
    this.setState({ open: false });
  };

  add = (found: SearchItem[]) => {
    this.setState((state) => ({ items: [...state.items, ...found] }));
  };

  load = () => {
    const { userInfo } = this.props;
    const pages: SearchItem[] = [];
    menuService.loadWorkspaces(userInfo).forEach((ws) => {
      menuService.loadMenus(ws, userInfo as LoginUserInfo).forEach((section) =>
        section.menus.forEach((menu) => {
          if (menu.to) {
            pages.push({ group: 'Pages', label: i18n.t(menu.label), detail: i18n.t(ws.label || ws.name), to: menu.to });
          }
        })
      );
    });
    this.add(pages);
    getApplicationList({}).then((res: any) =>
      this.add(
        (res?.applications || []).map((a: any) => ({
          group: 'Applications',
          label: a.name,
          detail: [a.alias, a.project?.alias || a.project?.name].filter(Boolean).join(' · '),
          to: `/applications/${a.name}/config`,
        }))
      )
    );
    getProjectList({}).then((res: any) =>
      this.add(
        (res?.projects || []).map((p: any) => ({
          group: 'Projects',
          label: p.name,
          detail: p.alias,
          to: `/projects/${p.name}/summary`,
        }))
      )
    );
    getEnvs({}).then((res: any) =>
      this.add(
        (res?.envs || []).map((e: any) => ({
          group: 'Environments',
          label: e.name,
          detail: [e.alias, e.namespace].filter(Boolean).join(' · '),
          to: '/envs',
        }))
      )
    );
    getTarget({}).then((res: any) =>
      this.add(
        (res?.targets || []).map((t: any) => ({ group: 'Targets', label: t.name, detail: t.alias, to: '/targets' }))
      )
    );
    const project = this.project();
    definitionTypes.forEach((type) =>
      getDefinitionsList({ project, definitionType: type, queryAll: false }).then((res: any) =>
        this.add(
          (res?.definitions || []).map((d: any) => ({
            group: 'Definitions',
            label: d.name,
            detail: d.scope === 'project' ? `${type} · ${i18n.t('Project').toString()}` : type,
            to: `/definitions/${type}/${d.name}/ui-schema${definitionPlaceQuery({ project, where: d.scope })}`,
          }))
        )
      )
    );
    listTemplates().then((res: any) =>
      this.add(
        (res?.templates || []).map((t: any) => ({
          group: 'Configs',
          label: t.name,
          detail: t.alias,
          to: `/configs/${t.name}/config`,
        }))
      )
    );
  };

  go = (item?: SearchItem) => {
    if (item) {
      // A recent item is shown under Recent; it is kept under the group it came from.
      this.remember(item.group === recentGroup ? this.state.recent.find((r) => r.to === item.to) : item);
      locationService.push(item.to);
      this.close();
    }
  };

  onKeyDown = (e: React.KeyboardEvent, results: SearchItem[]) => {
    const { active } = this.state;
    switch (e.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.setState({ active: Math.min(active + 1, results.length - 1) });
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.setState({ active: Math.max(active - 1, 0) });
        break;
      case 'Enter':
        this.go(results[active]);
        break;
    }
  };

  renderPalette() {
    const { query, items, active } = this.state;
    const results = query
      ? matchItems(items, query, groups, 5)
      : [...this.state.recent.map((item) => ({ ...item, group: recentGroup })), ...matchItems(items, '', groups, 3)];
    let lastGroup = '';
    return (
      <div className="quick-search-mask" onMouseDown={this.close}>
        <div className="quick-search-palette" onMouseDown={(e) => e.stopPropagation()}>
          <div className="quick-search-input">
            <AiOutlineSearch size={18} />
            <input
              ref={this.input}
              value={query}
              placeholder={i18n.t('Search applications, projects, definitions, pages…').toString()}
              onChange={(e) => this.setState({ query: e.target.value, active: 0 })}
              onKeyDown={(e) => this.onKeyDown(e, results)}
            />
            <kbd>esc</kbd>
          </div>
          <div className="quick-search-results">
            {results.length === 0 && <div className="quick-search-empty">{i18n.t('No matches').toString()}</div>}
            {results.map((item, i) => {
              const heading = item.group !== lastGroup ? item.group : '';
              lastGroup = item.group;
              return (
                <React.Fragment key={`${item.group}/${item.label}/${item.detail || ''}`}>
                  {heading && <div className="quick-search-group">{i18n.t(heading).toString()}</div>}
                  <div
                    className={i === active ? 'quick-search-item active' : 'quick-search-item'}
                    onMouseEnter={() => this.setState({ active: i })}
                    onClick={() => this.go(item)}
                  >
                    <span className="quick-search-label">{item.label}</span>
                    {item.detail && <span className="quick-search-detail">{item.detail}</span>}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="quick-search-footer">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> {i18n.t('to move').toString()}
            </span>
            <span>
              <kbd>↵</kbd> {i18n.t('to open').toString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform);
    return (
      <>
        <div className="quick-search-trigger" onClick={this.open}>
          <AiOutlineSearch size={16} />
          <span>{i18n.t('Search applications, projects, definitions, pages…').toString()}</span>
          <kbd>{mac ? '⌘K' : 'Ctrl K'}</kbd>
        </div>
        {this.state.open && this.renderPalette()}
      </>
    );
  }
}

export default connect((store: any) => ({ currentProject: store.currentProject }))(QuickSearch);
