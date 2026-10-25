const { execFileSync } = require('node:child_process');
const path = require('node:path');

jest.setTimeout(90000);
test('event management and capacity-safe registration integration contracts', () => {
  const output = execFileSync(process.execPath, [path.join(__dirname, 'eventsIntegrationCheck.js')], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 85000,
  });
  expect(output).toContain('Event integration checks passed');
});
