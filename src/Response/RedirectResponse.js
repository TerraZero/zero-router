const ZeroResponse = require('../ZeroResponse');

module.exports = class RedirectResponse extends ZeroResponse {

  /**
   * @param {import('../Serve')} serve 
   */
  constructor(serve) {
    super(serve);
    this.url = null;
  }

  /**
   * @param {string} route
   * @param {Object} match 
   * @returns {this}
   */
  setRoute(route, match) {
    this.url = this.serve.router.getUrl(route, match);
    return this;
  }

  /**
   * @param {string} url 
   * @returns {this}
   */
  setUrl(url) {
    this.url = url;
    return this;
  }

  /**
   * @returns {import('../Serve')}
   */
  async execute() { 
    return await this.serve.router.setRedirectUrl(this.serve, this.url);
  }

}