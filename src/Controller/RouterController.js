/**
 * @controller (router)
 * @pattern (/_router)
 * @arg (@service.router)
 */
module.exports = class RouterController {

  /**
   * @param {import('../ZeroRouter')} router
   */
  constructor(router) {
    this.router = router;
    this._routes = null;
  }

  get routes() {
    if (this._routes === null) {
      this._routes = {};
      for (const controller of this.router.controllers) {
        this._routes[controller.id] = controller.url;
      }
    }
    return this._routes;
  }

  /**
   * @route (routes)
   * @pattern (/routes)
   * @param {import('../Serve')} serve
   */
  getRoutes(serve) {
    serve.json({ routes: this.routes }).send();
  }

}