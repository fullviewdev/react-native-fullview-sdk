import FullviewSDK, { FullviewRegion, FullviewState } from '../index';
import NativeFullviewSdk from '../NativeFullviewSdk';
import { toFullviewState } from '../sdk-module';

jest.mock('../NativeFullviewSdk', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => Promise.resolve()),
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

  it('names the workspace once, on init, not with every customer', async () => {
    // init() also patches XMLHttpRequest to watch the app's requests, and this environment has
    // none; the patch is covered by network-observer.test.ts.
    global.XMLHttpRequest = class {
      open() {}
      send() {}
      setRequestHeader() {}
      addEventListener() {}
      getAllResponseHeaders() {
        return '';
      }
    } as unknown as typeof XMLHttpRequest;

    await FullviewSDK.init({
      region: FullviewRegion.EU1,
      organisationId: 'org',
    });

    // `configure` on the bridge, `init` in public: a void method whose selector begins with
    // "init" is a compile error in Objective-C under ARC.
    expect(mockNative.configure).toHaveBeenCalledWith('eu1', 'org');
  });

  it('forwards the identity to the native module, filling the absent fields', async () => {
    await FullviewSDK.registerCustomer({
      id: 'user',
      name: 'Name',
      email: 'e@x.io',
    });
    // Everything the identity left out arrives as the native side's "not set": empty strings,
    // null for the optional env, an empty roles array, and recording on any network.
    expect(mockNative.registerCustomer).toHaveBeenCalledWith(
      'user',
      'Name',
      'e@x.io',
      false,
      null,
      [],
      false,
      false
    );
  });

  /** There is no device id to pass any more - the backend owns it. */
  it('has no device id in its surface at all', () => {
    expect(
      JSON.stringify(mockNative.registerCustomer.mock.calls)
    ).not.toContain('device');
  });

  it("passes the identity's own fields through, including the web-shaped ones", async () => {
    await FullviewSDK.registerCustomer({
      id: 'user',
      name: 'Name',
      email: 'e@x.io',
      isAnonymous: true,
      env: 'staging',
      roles: ['admin', 'beta'],
      recordWifiOnly: true,
      disableReplaysForUser: true,
    });

    expect(mockNative.registerCustomer).toHaveBeenCalledWith(
      'user',
      'Name',
      'e@x.io',
      true,
      'staging',
      ['admin', 'beta'],
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
