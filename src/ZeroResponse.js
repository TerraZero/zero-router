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
  async doExecute() {
    this.execute();
    if (!this.serve.sended) this.serve.send();
    return this.serve;
  }

  async execute() { }

}