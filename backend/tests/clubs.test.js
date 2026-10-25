const { execFileSync } = require('node:child_process');
const path = require('node:path');

jest.setTimeout(60000);
test('club management and membership integration contracts', () => {
  const output = execFileSync(process.execPath, [path.join(__dirname, 'clubIntegrationCheck.js')], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 55000,
  });
  expect(output).toContain('Club integration checks passed');
});
