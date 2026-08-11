import React from 'react';
import { render, act } from '@testing-library/react';
import { SessionRefreshListener } from '../useSessionRefresh';

const mockIsAccessTokenStale = jest.fn();
const mockRefreshSession = jest.fn();
const mockUseAuthStore = jest.fn();

jest.mock('@/utils/axiosInstance', () => ({
  isAccessTokenStale: (...args: any[]) => mockIsAccessTokenStale(...args),
  refreshSession: (...args: any[]) => mockRefreshSession(...args),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: any) => any) => {
    const state = mockUseAuthStore();
    return selector(state);
  },
}));

let addEventListenerSpy: jest.SpyInstance;
let removeEventListenerSpy: jest.SpyInstance;

beforeEach(() => {
  mockUseAuthStore.mockReturnValue({ clientSession: false, user: null });
  mockIsAccessTokenStale.mockReturnValue(false);
  mockRefreshSession.mockResolvedValue(true);

  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible' as DocumentVisibilityState,
  });

  addEventListenerSpy = jest.spyOn(document, 'addEventListener');
  removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
});

afterEach(() => {
  jest.clearAllMocks();
  addEventListenerSpy?.mockRestore();
  removeEventListenerSpy?.mockRestore();
});

describe('SessionRefreshListener Component', () => {
  test('should register visibilitychange listener when hasSession is true', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    render(React.createElement(SessionRefreshListener));

    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  test('should NOT register listener when hasSession is false', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: false, user: null });
    render(React.createElement(SessionRefreshListener));

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  test('should register listener when clientSession is true', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    render(React.createElement(SessionRefreshListener));

    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  test('should call isAccessTokenStale once on mount', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    mockIsAccessTokenStale.mockReturnValue(true);
    render(React.createElement(SessionRefreshListener));

    expect(mockIsAccessTokenStale).toHaveBeenCalledTimes(1);
  });

  test('should call refreshSession on mount if token is stale', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    mockIsAccessTokenStale.mockReturnValue(true);
    render(React.createElement(SessionRefreshListener));

    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
  });

  test('should not call refreshSession on mount if token is not stale', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    mockIsAccessTokenStale.mockReturnValue(false);
    render(React.createElement(SessionRefreshListener));

    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  test('should call refreshSession on visibility change when token is stale', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    mockIsAccessTokenStale.mockReturnValue(true);
    render(React.createElement(SessionRefreshListener));

    mockRefreshSession.mockClear();
    mockIsAccessTokenStale.mockClear();
    mockIsAccessTokenStale.mockReturnValue(true);

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible' as DocumentVisibilityState,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockIsAccessTokenStale).toHaveBeenCalled();
    expect(mockRefreshSession).toHaveBeenCalled();
  });

  test('should NOT call refreshSession on visibility change when token is fresh', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    mockIsAccessTokenStale.mockReturnValue(false);
    render(React.createElement(SessionRefreshListener));

    mockRefreshSession.mockClear();

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible' as DocumentVisibilityState,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  test('should NOT trigger refresh when visibility changes to hidden', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    mockIsAccessTokenStale.mockReturnValue(true);
    render(React.createElement(SessionRefreshListener));

    mockRefreshSession.mockClear();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden' as DocumentVisibilityState,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  test('should remove event listener on unmount', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    const { unmount } = render(React.createElement(SessionRefreshListener));

    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  test('should render null (no DOM output)', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    const { container } = render(React.createElement(SessionRefreshListener));
    expect(container.innerHTML).toBe('');
  });
});

describe('Property 18: Visibility Change Refresh Trigger', () => {
  test('should trigger refresh on visibility change when session is active', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: true, user: null });
    mockIsAccessTokenStale.mockReturnValue(true);
    mockRefreshSession.mockResolvedValue(true);

    render(React.createElement(SessionRefreshListener));
    mockRefreshSession.mockClear();
    mockIsAccessTokenStale.mockClear();
    mockIsAccessTokenStale.mockReturnValue(true);

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible' as DocumentVisibilityState,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockIsAccessTokenStale).toHaveBeenCalled();
  });

  test('should NOT trigger refresh on visibility change when no session', () => {
    mockUseAuthStore.mockReturnValue({ clientSession: false, user: null });
    mockIsAccessTokenStale.mockReturnValue(false);
    mockRefreshSession.mockResolvedValue(true);

    render(React.createElement(SessionRefreshListener));
    mockRefreshSession.mockClear();
    mockIsAccessTokenStale.mockClear();
    mockIsAccessTokenStale.mockReturnValue(false);

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible' as DocumentVisibilityState,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockRefreshSession).not.toHaveBeenCalled();
  });
});
