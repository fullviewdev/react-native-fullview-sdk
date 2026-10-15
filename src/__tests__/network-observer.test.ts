import { observeNetwork } from '../network-observer';
import {
  isRedactedHeader,
  redactHeaders,
  REDACTED_VALUE,
} from '../redact-headers';

describe('redactHeaders', () => {
  it('hides a value whose name is a known secret, and keeps the name', () => {
    expect(
      redactHeaders({ Authorization: 'Bearer abc', accept: 'application/json' })
    ).toEqual({
      authorization: REDACTED_VALUE,
      accept: 'application/json',
    });
  });

  it('hides a credential whatever the header is called', () => {
    expect(isRedactedHeader('x-acme-token', 'Bearer abc')).toBe(true);
    expect(isRedactedHeader('x-acme-token', 'Basic abc')).toBe(true);
    expect(isRedactedHeader('x-acme-token', 'eyJhbGci.eyJzdWIi.sig')).toBe(
      true
    );
  });

  it('leaves an ordinary value alone', () => {
    expect(isRedactedHeader('content-type', 'application/json')).toBe(false);
  });
});

/** A minimal stand-in for React Native's XMLHttpRequest, which is what the observer patches. */
class FakeXHR {
  static instances: FakeXHR[] = [];
  status = 0;
  responseHeaders = '';
  private listeners: Record<string, Array<() => void>> = {};

  open(_method: string, _url: string) {}
  setRequestHeader(_name: string, _value: string) {}
  send(_body?: unknown) {
    FakeXHR.instances.push(this);
  }
  getAllResponseHeaders() {
    return this.responseHeaders;
  }
  addEventListener(event: string, handler: () => void) {
    (this.listeners[event] ??= []).push(handler);
  }
  emit(event: string) {
    for (const handler of this.listeners[event] ?? []) handler();
  }
}

describe('observeNetwork', () => {
  let sent: string[];
  let stop: () => void;

  beforeEach(() => {
    sent = [];
    FakeXHR.instances = [];
    (global as unknown as { XMLHttpRequest: unknown }).XMLHttpRequest = FakeXHR;
    stop = observeNetwork((payload) => sent.push(payload));
  });

  afterEach(() => stop());

  const request = (configure: (xhr: FakeXHR) => void = () => {}) => {
    const xhr = new (
      global as unknown as { XMLHttpRequest: new () => FakeXHR }
    ).XMLHttpRequest();
    xhr.open('post', 'https://api.example.com/orders');
    xhr.setRequestHeader('Authorization', 'Bearer secret');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send('{"a":1}');
    configure(xhr);
    return xhr;
  };

  it('reports the request the dashboard expects, with secrets redacted', () => {
    const xhr = request((x) => {
      x.status = 201;
      x.responseHeaders =
        'content-type: application/json\r\ncontent-length: 42';
    });
    xhr.emit('loadend');

    expect(JSON.parse(sent[0]!)).toMatchObject({
      url: 'https://api.example.com/orders',
      method: 'POST',
      statusCode: 201,
      requestHeaders: {
        'authorization': REDACTED_VALUE,
        'content-type': 'application/json',
      },
      responseHeaders: { 'content-type': 'application/json' },
      requestSize: 7,
      responseSize: 42,
    });
  });

  it('names the failure, and reports it once rather than again on loadend', () => {
    const xhr = request();
    xhr.emit('error');
    xhr.emit('loadend');

    expect(sent).toHaveLength(1);
    expect(JSON.parse(sent[0]!).error).toBe('NetworkError');
  });

  it('distinguishes a timeout from an abort', () => {
    request().emit('timeout');
    request().emit('abort');

    expect(sent.map((p) => JSON.parse(p).error)).toEqual([
      'TimeoutError',
      'AbortError',
    ]);
  });

  it('puts the original XMLHttpRequest back when it stops', () => {
    stop();
    request().emit('loadend');

    expect(sent).toHaveLength(0);
  });

  it('does not stack a second patch', () => {
    const second = observeNetwork((payload) => sent.push(payload));
    request().emit('loadend');

    expect(sent).toHaveLength(1);
    second();
  });

  it('never lets its own failure reach the app', () => {
    stop();
    stop = observeNetwork(() => {
      throw new Error('collector is down');
    });

    expect(() => request().emit('loadend')).not.toThrow();
  });
});
