import FullviewSDK, { FullviewRegion, FullviewState } from '../index';
import NativeFullviewSdk from '../NativeFullviewSdk';
import { toFullviewState } from '../sdk-module';

jest.mock('../NativeFullviewSdk', () => ({
  __esModule: true,
  default: {
    attach: jest.fn(() => Promise.resolve()),
    register: jest.fn(() => Promise.resolve()),
    logout: jest.fn(() => Promise.resolve()),
    requestCoBrowse: jest.fn(() => Promise.resolve()),
    cancelCoBrowseRequest: jest.fn(() => Promise.resolve()),
    getPositionInCoBrowseQueue: jest.fn(() => Promise.resolve(3)),
    getState: jest.fn(() => Promise.resolve('CO_BROWSE_REQUESTED')),
  },
}));

const mockNative = jest.mocked(NativeFullviewSdk!);

describe('FullviewSDK', () => {
  it('maps every native state string to the public enum', () => {
    expect(toFullviewState('CO_BROWSE_ACTIVE')).toBe(FullviewState.Active);
    expect(toFullviewState('CO_BROWSE_INVITATION')).toBe(
      FullviewState.Invitation
    );
    expect(toFullviewState('CO_BROWSE_REQUESTED')).toBe(
      FullviewState.CoBrowseRequested
    );
    expect(toFullviewState('IDLE')).toBe(FullviewState.Idle);
    expect(toFullviewState('')).toBe(FullviewState.Idle);
  });

  it('forwards register arguments to the native module unchanged', async () => {
    await FullviewSDK.register(
      FullviewRegion.EU1,
      'org',
      'user',
      'device',
      'Name',
      'e@x.io'
    );
    expect(mockNative.register).toHaveBeenCalledWith(
      'eu1',
      'org',
      'user',
      'device',
      'Name',
      'e@x.io'
    );
  });

  it('resolves getState through the mapping', async () => {
    await expect(FullviewSDK.getState()).resolves.toBe(
      FullviewState.CoBrowseRequested
    );
    await expect(FullviewSDK.getPositionInCoBrowseQueue()).resolves.toBe(3);
  });
});
