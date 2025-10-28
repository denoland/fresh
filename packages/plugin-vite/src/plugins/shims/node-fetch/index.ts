export default globalThis.fetch;
const _Headers = globalThis.Headers;
const _Request = globalThis.Request;
const _Response = globalThis.Response;
const _FetchError = globalThis.DOMException;
const _AbortError = globalThis.DOMException;

export {
  _AbortError as AbortError,
  _FetchError as FetchError,
  _Headers as Headers,
  _Request as Request,
  _Response as Response,
};
