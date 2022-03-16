const Parser = require('zero-annotation');
const Pattern = require('url-pattern');
const ZeroResponse = require('./ZeroResponse');

/**
 * @service (router)
 */
module.exports = class ZeroRouter {

  constructor() {
    /** @type {import('zero-annotation/src/DefaultPluginManager')} */
    this.manager = this.parser.createPluginManager('controller', {
      main: ['id', 'pattern'],
      fields: {
        pattern: 'pattern',
        access: 'access',
        prepare: 'prepare',
      },
      methods: {
        route: {
          main: ['id', 'pattern'],
          fields: {
            pattern: 'pattern',
            access: 'access',
            prepare: 'prepare',
            request: 'request',
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

      if (info.controller.request.length && !info.controller.request.includes(serve.getMethod())) {
        return serve.RESPONSE.errorBadRequest('Not supported method "' + serve.getMethod() + '". Only methods "' + info.controller.request.join(', ') + '" allowed.').send();
      }

      for (const callback of info.controller.prepare) {
        const result = await this.parser.call(info.controller.definition, callback, serve);
        if (result instanceof ZeroResponse) {
          return await result.execute(this);
        }
      }

      for (const callback of info.controller.access) {
        const value = await this.parser.call(info.controller.definition, callback, serve);
        if (value instanceof ZeroResponse) {
          return await value.execute(this);
        } else if (typeof value === 'string') {
          return serve.RESPONSE.errorForbidden(value).send();
        } else if (!value) {
          return serve.RESPONSE.errorForbidden().send();
        }
      }
      
      try {
        const result = await controller[info.controller.route._method.name](serve);
        if (result instanceof ZeroResponse) {
          await result.execute(this);
        }
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
   * @param {import('./Serve')} serve
   * @param {string} route 
   * @param {Object} match
   * @returns {import('./Serve')}
   */
  async setRedirect(serve, route, match = null) {
    if (match === null) match = serve.MATCH;
    return this.setRedirectUrl(serve, this.getUrl(route, match));
  }

  /**
   * @param {import('./Serve')} serve
   * @param {string} url
   * @returns {import('./Serve')}
   */
  async setRedirectUrl(serve, to) {
    const from = serve.url();
    serve.meta('redirect', { from, to }, true);
    serve.request.url = to;
    return this.serve(serve);
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
        prepare: this.getDefinitionField('prepare', definition, route),
        access: this.getDefinitionField('access', definition, route),
        request: this.getDefinitionField('request', definition, route),
      });
    }
  }

  getDefinitionField(field, ...definitions) {
    const values = [];
    for (const definition of definitions) {
      if (!definition[field]) continue;
      (Array.isArray(definition[field]) ? definition[field] : [definition[field]])
        .forEach(v => values.push(v));
    }
    return values;
  }

}