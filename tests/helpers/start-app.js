/*global require:true, define:true*/

import Ember from 'ember';
import Application from '../../app';
import config from '../../config/environment';

function ajax(app, url, method, status, response, data, options = {}) {
  Ember.run(function() {
    Ember.$.fauxjax.removeExisting(url, method);
    var request = { url: url , method: method };
    if (data) {
      request.data = data;
      request.contentType = 'application/json';
    }
    Ember.$.fauxjax.new({
      request: request,
      response: {
        status: status,
        content: response,
        responseTime: options.responseTime
      }
    });
  });
  return app.testHelpers.wait();
}

Ember.Test.registerAsyncHelper('ajax', ajax);

export default function startApp(attrs) {
  let attributes = Ember.merge({}, config.APP);
  attributes = Ember.merge(attributes, attrs); // use defaults, but you can override;

  require.unsee('dummy/services/redux');
  require.unsee('dummy/middleware/index');

  return Ember.run(() => {
    let isReduxSagaTestCase = window.middlewareArgs === null;

    if (isReduxSagaTestCase) {

      define('dummy/middleware/index', ['exports', 'ember', 'redux-saga', 'dummy/sagas/counter'], function (exports, _ember, createSaga, addAsync) {
        while ('default' in addAsync) {
          addAsync = addAsync.default;
        }

        while ('default' in createSaga) {
          createSaga = createSaga.default;
        }

        var sagaMiddleware = createSaga();

        const setup = (...args) => {
          window.middlewareArgs = args;
          sagaMiddleware.run(addAsync);
        };

        exports['default'] = {
          middleware: [ sagaMiddleware ],
          setup: setup
        };
      });

    } else {

      define('dummy/middleware/index', ['exports', 'redux-thunk'], function (exports, _reduxThunk) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        var resolved = _reduxThunk.default.default ? _reduxThunk.default.default : _reduxThunk.default;
        exports.default = [resolved];
      });

    }

    let application = Application.create(attributes);
    application.setupForTesting();
    application.injectTestHelpers();
    return application;
  });
}
