import { Select } from '@alifd/next';
import { connect } from 'dva';
import React, { useEffect, useMemo } from 'react';
import { AiOutlineProject } from 'react-icons/ai';

import type { LoginUserInfo } from '@velaux/data';
import i18n from '../../i18n';
import { locale } from '../../utils/locale';
import { allProjects, askedProject, resolveProject, seesAllProjects } from '../../utils/currentProject';
import './index.less';

type Props = {
  userInfo?: LoginUserInfo;
  current: string;
  resolved: boolean;
  dispatch: (action: any) => void;
};

// ProjectPicker sets the project every view is scoped to, from those the user may open.
const ProjectPickerView = (props: Props) => {
  const { userInfo, current, resolved, dispatch } = props;
  const projects = useMemo(() => userInfo?.projects || [], [userInfo?.projects]);
  const all = seesAllProjects(userInfo);

  useEffect(() => {
    if (!userInfo?.name) {
      return;
    }
    const want = resolved ? current : askedProject();
    const project = resolveProject(
      want,
      projects.map((p) => p.name),
      all
    );
    if (!resolved || project !== current) {
      dispatch({ type: 'currentProject/setProject', payload: project });
    }
  }, [userInfo?.name, projects, all, resolved, current, dispatch]);

  if (!userInfo?.name || projects.length === 0) {
    return null;
  }
  const options = [
    ...(all ? [{ label: i18n.t('All projects').toString(), value: allProjects }] : []),
    ...projects.map((p) => ({ label: p.alias || p.name, value: p.name })),
  ];
  return (
    <Select
      className="project-picker"
      label={<AiOutlineProject className="project-picker-icon" />}
      value={current}
      dataSource={options}
      locale={locale().Select}
      autoWidth={false}
      onChange={(value: string) => dispatch({ type: 'currentProject/setProject', payload: value || allProjects })}
      aria-label={i18n.t('Project').toString()}
    />
  );
};

export const ProjectPicker = connect((store: any) => ({
  userInfo: store.user.userInfo,
  current: store.currentProject.current,
  resolved: store.currentProject.resolved,
}))(ProjectPickerView);
