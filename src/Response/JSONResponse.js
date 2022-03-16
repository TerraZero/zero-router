const ZeroResponse = require('../ZeroResponse');

module.exports = class JSONResponse extends ZeroResponse {

  /**
   * @param {import('../Serve')} serve 
   */
  constructor(serve) {
    super(serve);
    this.json = null;
  }

  setJSON(value) {
    this.json = value;
    return this;
  }

  /**
   * @returns {import('../Serve')}
   */
  async execute() { 
    return await this.serve.json(this.json || {});
  }

}