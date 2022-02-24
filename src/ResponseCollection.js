module.exports = class ResponseCollection {

  /**
   * @param {import('./Serve')} serve
   */
  constructor(serve) {
    this.serve = serve;
  }

  /**
   * @param {int} code 
   * @param {...any} args
   * @returns {this}
   */
  setCode(code, ...args) {
    if (code === 200) {
      this.serve.meta('status', 200);
    } else if (code === 403) {
      this.serve.error(403, (args[0] ? '[Forbidden]: ' + args[0] : 'Forbidden'));
    } else if (code === 404) {
      this.serve.error(404, 'Not found');
    } else if (code === 500) {
      this.serve.error(500, '[Internal Server Error]' + (args[0] ? ': ' + args[0] : ''));
    } else if (code === 501) {
      this.serve.error(501, '[Not Implemented]' + (args[0] ? ': ' + args[0] : ''));
    } else if (code === 503) {
      this.serve.error(503, '[Service unavailable]' + (args[0] ? ': ' + args[0] : ''));
    }
    return this;
  }

  /**
   * @returns {import('./Serve')}
   */
  ok() {
    return this.setCode(200).serve;
  }

  /**
   * @returns {import('./Serve')}
   */
  errorForbidden(message = null) {
    return this.setCode(403, message).serve;
  }

  /**
   * @returns {import('./Serve')}
   */
  errorNotFound() {
    return this.setCode(404).serve;
  }

  /**
   * @param {string} message
   * @returns {import('./Serve')}
   */
  errorInternalServerError(message = 'Internal Server Error') {
    return this.setCode(500, message).serve;
  }

  /**
   * @returns {import('./Serve')}
   */
  errorServiceUnavailable(message = 'Service unavailable') {
    return this.setCode(503, message).serve;
  }

}