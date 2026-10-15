/**
 * What a developer is told when the native module is not there.
 *
 * Expo Go is singled out because it is the one cause nothing in their project can fix: its native
 * half is Expo's prebuilt binary and this package brings its own compiled code. Reading the
 * generic "doesn't seem to be linked" list there sends someone to run `pod install` in a project
 * that has no ios directory.
 */
const loadWithoutNativeModule = () => {
  jest.resetModules();
  jest.doMock('../NativeFullviewSdk', () => ({
    __esModule: true,
    default: null,
  }));

  return require('../sdk-module').default;
};

describe('a missing native module', () => {
  afterEach(() => {
    jest.dontMock('expo');
    jest.resetModules();
  });

  it('names Expo Go, and how to leave it, when that is where it is running', () => {
    jest.doMock('expo', () => ({ isRunningInExpoGo: () => true }), {
      virtual: true,
    });

    expect(() => loadWithoutNativeModule().logout()).toThrow(
      /cannot run in Expo Go/
    );
    expect(() => loadWithoutNativeModule().logout()).toThrow(/expo prebuild/);
  });

  it('falls back to the linking checklist outside Expo Go', () => {
    jest.doMock('expo', () => ({ isRunningInExpoGo: () => false }), {
      virtual: true,
    });

    expect(() => loadWithoutNativeModule().logout()).toThrow(
      /doesn't seem to be linked/
    );
  });

  /** A bare React Native app has no `expo` to require at all, which must not throw on its own. */
  it('falls back to the linking checklist when expo is not installed', () => {
    jest.doMock('expo', () => {
      throw new Error('Cannot find module expo');
    });

    expect(() => loadWithoutNativeModule().logout()).toThrow(
      /doesn't seem to be linked/
    );
  });
});
