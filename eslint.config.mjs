import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        ignores: ['.dev-server/'],
    },
    {
        files: ['**/*.test.js', 'test/**/*.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                before: 'readonly',
                after: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
            },
        },
    },
];
