const Parser = require('zero-annotation');
const Pattern = require('url-pattern');

module.exports = class ZeroRouter {

  constructor() {
    /** @type {import('zero-annotation/src/DefaultPluginManager')} */
    this.manager = this.parser.createPluginManager('controller', {
      main: ['id', 'pattern'],
      fields: {
        pattern: 'pattern',
      },
      methods: {
        route: {
          main: ['id', 'pattern'],
          fields: {
            pattern: 'pattern',
            access: 'access',
            prepare: 'prepare',
          },
        },
      },
    });
    this._controllers = null;

    this.parser.handler.on('plugins.controller', ({ definitions }) => {
      for (const definition of definitions) {
        this.addDefinition(definition);
      }
    });
  }

  get parser() {
    return Parser;
  }

  get controllers() {
    if (this._controllers === null) {
      // trigger event "plugins.controller"
      this.manager.getDefinitions();
    } 
    return this._controllers;
  }

  getUrl(route, match) {
    return this.getController(route).pattern.stringify(match);
  }

  getController(route) {
    return this.controllers.find(v => v.id === route);
  }

  /**
   * @param {import('./Serve')} serve 
   */
  async serve(serve) {
    try {
      const info = this.getControllerDefinition(serve.url());

      if (info === null) return serve.RESPONSE.errorNotFound().send();

      serve.setInfo(info);
      const controller = this.manager.get(info.controller.definition);

      if (info.controller.route.prepare) {
        await this.parser.call(info.controller.definition, info.controller.route.prepare, serve);
      }
      if (info.controller.route.access) {
        let accesses = [];
        if (Array.isArray(info.controller.route.access)) {
          accesses = info.controller.route.access;
        } else {
          accesses = [info.controller.route.access];
        }
        for (const access of accesses) {
          const value = await this.parser.call(info.controller.definition, access, serve);
          if (typeof value === 'string') {
            return serve.RESPONSE.errorForbidden(value).send();
          } else if (!value) {
            return serve.RESPONSE.errorForbidden().send();
          }
        }
      }
      try {
        await controller[info.controller.route._method.name](serve);
        if (!serve.sended) serve.send();
      } catch (e) {
        serve._data = null;
        serve.RESPONSE.errorServiceUnavailable(e.message).send();
      }
    } catch (e) {
      serve._data = null;
      serve.RESPONSE.errorInternalServerError(e.message).send();
    }
    return serve;
  }

  /**
   * @param {string} url 
   */
  getControllerDefinition(url) {
    let match = null;
    const controller = this.controllers.find(v => match = v.pattern.match(url));
    return controller && { controller, match } || null;
  }

  addDefinition(definition) {
    this._controllers = this._controllers || [];
    for (const route of definition.route) {
      this._controllers.push({
        id: definition.id + '.' + route.id,
        pattern: new Pattern(definition.pattern + route.pattern),
        definition: definition,
        route: route,
        url: definition.pattern + route.pattern,
      });
    }
  }

}