module.exports = class ZeroResponse {

  /**
   * @param {import('./Serve')} serve 
   */
  constructor(serve) {
    this.serve = serve;
  }

  /**
   * @returns {import('../Serve')}
   */
  async execute() { 
    return this.serve;
  }

}