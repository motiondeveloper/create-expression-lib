import { welcome } from './index';

test('returns correct welcome string', () => {
  expect(welcome('test')).toEqual('Welcome test!');
});
