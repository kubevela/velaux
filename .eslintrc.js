module.exports = {
  extends: ['@grafana/eslint-config'],
  root: true,
  plugins: ['@emotion', 'lodash', 'jest', 'import', 'jsx-a11y'],
  globals: {
    page: true,
    __COMMIT_HASH__: 'readonly',
  },
  rules: {
    eqeqeq: 'off',
    'react/prop-types': 'off',
    // need to ignore emotion's `css` prop, see https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/no-unknown-property.md#rule-options
    // 'react/no-unknown-property': ['error', { ignore: ['css'] }],
    // 'import/order': [
    //   'error',
    //   {
    //     groups: [['builtin', 'external'], 'internal', 'parent', 'sibling', 'index'],
    //     'newlines-between': 'always',
    //     alphabetize: { order: 'asc' },
    //   },
    // ],
    'import/order': 'off',
    'react/jsx-key': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-redux',
            importNames: ['useDispatch', 'useSelector'],
            message: 'Please import from app/types instead.',
          },
          {
            name: 'react-i18next',
            importNames: ['Trans', 't'],
            message: 'Please import from app/core/internationalization instead',
          },
        ],
      },
    ],
    'no-duplicate-imports': 'off',
    "import/no-duplicates": "warn",
    'react/no-deprecated': 'off',
    'react/no-unknown-property': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/array-type': 'off',
  },
  overrides: [
    {
      files: ['packages/velaux-ui/src/utils/common.ts'],
      rules: {
        'no-redeclare': 'off',
      },
    },
  ],
};
