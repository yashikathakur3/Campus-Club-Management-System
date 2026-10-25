const { execFileSync } = require('node:child_process');
const path = require('node:path');

jest.setTimeout(60000);

test('authentication and seeded admin integration contracts', () => {
  const output = execFileSync(process.execPath, [path.join(__dirname, 'authIntegrationCheck.js')], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    timeout: 55000,
  });
  expect(output).toContain('Authentication integration checks passed');
});
