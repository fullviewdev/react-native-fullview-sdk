/**
 * Records the app's HTTP requests as the same `network` event the web SDK sends.
 *
 * It patches `XMLHttpRequest` rather than anything native, because React Native implements `fetch`
 * on top of its own `XMLHttpRequest`, so one patch in JavaScript covers both platforms and every
 * HTTP client the app layers on top - fetch, axios, Apollo. The native alternatives are
 * platform-specific and far more invasive: on iOS a `URLProtocol` puts the SDK in the data path of
 * every request, which is how other vendors have broken certificate pinning and background
 * sessions, and on Android an OkHttp interceptor cannot reach the host's own client without
 * bytecode instrumentation at build time.
 *
 * What it therefore does *not* see: requests made by native modules on their own, image loading,
 * and WebSocket traffic. Those never pass through JavaScript.
 */
import { redactHeaders } from './redact-headers';

/** The shape the dashboard already renders for a web `network` event. */
type NetworkPayload = {
  url: string;
  method?: string;
  statusCode?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestSize?: number;
  responseSize?: number;
  duration?: number;
  error?: string;
};

type Send = (payload: string) => void;

/** What the patch hangs off each request, so concurrent requests cannot read each other's state. */
const STATE = Symbol('fullview.network');

type Observed = XMLHttpRequest & {
  [STATE]?: {
    url: string;
    method: string;
    requestHeaders: Record<string, string>;
    requestSize: number;
    startedAt: number;
    reported: boolean;
  };
};

let restore: (() => void) | undefined;

/** Response headers as a map. `getAllResponseHeaders` returns them CRLF-separated. */
const parseResponseHeaders = (raw: string): Record<string, string> => {
  const headers: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator > 0)
      headers[line.slice(0, separator).trim().toLowerCase()] = line
        .slice(separator + 1)
        .trim();
  }

  return headers;
};

/** Bytes in a request body, for the sizes the dashboard shows. Only what can be measured cheaply. */
const bodySize = (body: unknown): number => {
  if (typeof body === 'string') return body.length;
  if (body instanceof ArrayBuffer) return body.byteLength;
  if (ArrayBuffer.isView(body as ArrayBufferView))
    return (body as ArrayBufferView).byteLength;
  return 0;
};

/**
 * Starts recording. Returns a function that puts the original `XMLHttpRequest` back; calling
 * `observeNetwork` twice without it is a no-op, so a double `init` cannot stack two patches.
 */
export function observeNetwork(send: Send): () => void {
  if (restore) return restore;

  const Original = global.XMLHttpRequest;
  const open = Original.prototype.open;
  const setRequestHeader = Original.prototype.setRequestHeader;
  const xhrSend = Original.prototype.send;

  Original.prototype.open = function patchedOpen(
    this: Observed,
    method: string,
    url: string,
    ...rest: unknown[]
  ) {
    this[STATE] = {
      url: String(url),
      method: String(method).toUpperCase(),
      requestHeaders: {},
      requestSize: 0,
      startedAt: 0,
      reported: false,
    };
    // @ts-expect-error forwarding the original signature, which has optional trailing arguments
    return open.call(this, method, url, ...rest);
  };

  Original.prototype.setRequestHeader = function patchedSetRequestHeader(
    this: Observed,
    name: string,
    value: string
  ) {
    const state = this[STATE];
    if (state) state.requestHeaders[String(name).toLowerCase()] = String(value);
    return setRequestHeader.call(this, name, value);
  };

  Original.prototype.send = function patchedSend(
    this: Observed,
    body?: unknown
  ) {
    const state = this[STATE];

    if (state) {
      state.startedAt = Date.now();
      state.requestSize = bodySize(body);

      const report = (error?: string) => {
        // `loadend` fires after `error` and `timeout`, so without this a failed request reports
        // twice - once with the error and once as a status-0 response.
        if (state.reported) return;
        state.reported = true;

        const payload: NetworkPayload = {
          url: state.url,
          method: state.method,
          statusCode: this.status,
          requestHeaders: redactHeaders(state.requestHeaders),
          duration: Date.now() - state.startedAt,
        };
        if (state.requestSize) payload.requestSize = state.requestSize;

        const raw = safely(() => this.getAllResponseHeaders());
        if (raw) {
          const responseHeaders = parseResponseHeaders(raw);
          payload.responseHeaders = redactHeaders(responseHeaders);
          const length = Number(responseHeaders['content-length']);
          if (Number.isFinite(length)) payload.responseSize = length;
        }
        if (error) payload.error = error;

        safely(() => send(JSON.stringify(payload)));
      };

      this.addEventListener('loadend', () => report());
      this.addEventListener('error', () => report('NetworkError'));
      this.addEventListener('timeout', () => report('TimeoutError'));
      this.addEventListener('abort', () => report('AbortError'));
    }

    return xhrSend.call(this, body as Parameters<typeof xhrSend>[0]);
  };

  restore = () => {
    Original.prototype.open = open;
    Original.prototype.setRequestHeader = setRequestHeader;
    Original.prototype.send = xhrSend;
    restore = undefined;
  };

  return restore;
}

/**
 * Nothing the observer does may change how a request behaves. It sits in the app's own networking,
 * so a throw here would surface as the app's request failing.
 */
const safely = <T>(action: () => T): T | undefined => {
  try {
    return action();
  } catch {
    return undefined;
  }
};
