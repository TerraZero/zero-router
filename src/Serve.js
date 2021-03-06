const URL = require('url');
const ResponseCollection = require('./ResponseCollection');

module.exports = class Serve {

  /**
   * @param {import('./ZeroRouter')} router
   * @param {import('http').ClientRequest} request 
   * @param {import('http').ServerResponse} response
   */
  constructor(router, request, response) {
    this.router = router;
    this.request = request;
    this.response = response;
    this.sended = false;

    this._info = null;
    this._values = {};

    this._meta = {};
    this._data = {};

    this._body = null;
    this._json = null;

    this._response_collection = null;
  }

  /**
   * @param {(string|number)} value 
   * @param {*} fallback 
   * @returns {number}
   */
  float(value, fallback = null) {
    if (typeof value === 'number') return value;
    if (parseFloat(value) + '' === value) return parseFloat(value);
    return fallback;
  }

  /**
   * @param {(string|number)} value 
   * @param {*} fallback 
   * @returns {number}
   */
  int(value, fallback = null) {
    if (typeof value === 'number') return value;
    if (parseInt(value) + '' === value) return parseInt(value);
    return fallback;
  }

  /**
   * @param {(string|number|boolean)} value 
   * @param {*} fallback 
   * @returns {boolean}
   */
  bool(value, fallback = null) {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return fallback;
  }

  /**
   * @param {(Object|string|number|boolean)} value
   * @param {*} fallback
   * @returns {Object}
   */
  object(value) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value + '');
      } catch (e) {}
    }
    return value;
  }

  /**
   * @param {(Object|string|number|boolean)} value
   * @param {*} fallback
   * @returns {*}
   */
  val(value, fallback = null) {
    let data = this.bool(value);
    if (data === null) data = this.float(value);
    if (data === null) data = this.int(value);
    if (data === null) data = this.object(value);
    if (data === null) data = fallback;
    return data;
  }

  get RESPONSE() {
    if (this._response_collection === null) {
      this._response_collection = new ResponseCollection(this);
    }
    return this._response_collection;
  }

  get MATCH() {
    return this._info.match;
  }

  get(name) {
    return this._values[name];
  }

  set(name, value) {
    this._values[name] = value;
    return this;
  }

  setInfo(info) {
    this._info = info;
    return this;
  }

  url() {
    if (this.request.url.endsWith('/')) {
      return this.request.url.substring(0, this.request.url.length - 1);
    }
    return this.request.url;
  }

  getUrl() {
    return URL.parse(this.url(), true);
  }

  meta(name, value, isArray = false) {
    if (isArray) {
      this._meta[name] = this._meta[name] || [];
      this._meta[name].push(value);
    } else {
      this._meta[name] = value;
    }
    return this;
  }

  /**
   * @param {number} code 
   * @param {string} message 
   * 
   * @returns {this}
   */
  error(code, message) {
    this.meta('status', code);
    this.meta('error', {code, message});
    return this;
  }

  json(data) {
    this.RESPONSE.ok();
    this._data = data;
    return this;
  }

  send() {
    this.sended = true;
    return new Promise((resolve, reject) => {
      this.response.setHeader('Content-Type', 'application/json');
      const sending = {data: this._data, meta: this._meta};

      this.response.end(JSON.stringify(sending), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * @returns {string}
   */
  getMethod() {
    return this.request.method;
  }

  /** @returns {boolean} */
  isPOST() {
    return this.getMethod() === 'POST';
  }

  /** @returns {boolean} */
  isGET() {
    return this.getMethod() === 'GET';
  }

  /** @returns {Promise<string>} */
  async getBody() {
    if (this._body === null) {
      return new Promise((resolve, reject) => {
        this._body = '';
        
        this.request.on('data', (chunk) => {
          this._body += chunk;
        });
  
        this.request.on('end', () => {
          resolve(this._body);
        });
      });
    } else {
      return Promise.resolve(this._body);
    }
  }

  /** @returns {Promise<object>} */
  async getJSON() {
    if (this._json === null) {
      try {
        this._json = JSON.parse(await this.getBody());
      } catch (e) {}
    } 
    return this._json;
  }

}