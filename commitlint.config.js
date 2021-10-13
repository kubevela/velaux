module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    'type-enum': [
      // 配置的具体规则（这里是提交的type）
      // 报错级别 0为disable，1为warning，2为error 就是检查的级别
      2,
      'always',
      // 枚举的type值，不在下面的都报错
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test'
      ]
    ]
  }
};
