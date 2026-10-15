import FullviewSDK, { FullviewRegion, FullviewState } from '../index';
import NativeFullviewSdk from '../NativeFullviewSdk';
import { toFullviewState } from '../sdk-module';

jest.mock('../NativeFullviewSdk', () => ({
  __esModule: true,
  default: {
    attach: jest.fn(() => Promise.resolve()),
    registerCustomer: jest.fn(() => Promise.resolve()),
    logout: jest.fn(() => Promise.resolve()),
    requestCoBrowse: jest.fn(() => Promise.resolve()),
    cancelCoBrowseRequest: jest.fn(() => Promise.resolve()),
    getPositionInCoBrowseQueue: jest.fn(() => Promise.resolve(3)),
    getState: jest.fn(() => Promise.resolve('CO_BROWSE_REQUESTED')),
    setScreen: jest.fn(() => Promise.resolve()),
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

  it('forwards the screen name to the native module unchanged', async () => {
    await FullviewSDK.setScreen('Invoice #1042');

    // Passed through as written: the app decides what an agent should read, and anything the
    // bridge did to it here - trimming, lower-casing, a route-shaped guess - would be the SDK
    // overruling that.
    expect(mockNative.setScreen).toHaveBeenCalledWith('Invoice #1042');
  });

  it('forwards registerCustomer arguments to the native module unchanged', async () => {
    await FullviewSDK.registerCustomer(
      FullviewRegion.EU1,
      'org',
      'user',
      'device',
      'Name',
      'e@x.io'
    );
    // Recording on any network unless the host asks otherwise.
    expect(mockNative.registerCustomer).toHaveBeenCalledWith(
      'eu1',
      'org',
      'user',
      'device',
      'Name',
      'e@x.io',
      false,
      false
    );
  });

  it('passes the recording options through', async () => {
    await FullviewSDK.registerCustomer(
      FullviewRegion.EU1,
      'org',
      'user',
      undefined,
      'Name',
      'e@x.io',
      { recordWifiOnly: true, disableReplaysForUser: true }
    );
    expect(mockNative.registerCustomer).toHaveBeenCalledWith(
      'eu1',
      'org',
      'user',
      null,
      'Name',
      'e@x.io',
      true,
      true
    );
  });

  it('resolves getState through the mapping', async () => {
    await expect(FullviewSDK.getState()).resolves.toBe(
      FullviewState.CoBrowseRequested
    );
    await expect(FullviewSDK.getPositionInCoBrowseQueue()).resolves.toBe(3);
  });
});
