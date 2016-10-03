const assert = require('assert');
const should = require('should');
const Bluebird = require('bluebird');

const HMQEventsPublisher = require('../../publisher');

const aux = require('../aux');

describe('HMQEventsPublisher initialization', function () {

  beforeEach(function () {
    return aux.setup();
  });

  afterEach(function () {
    return aux.teardown();
  });

  var BASE_OPTIONS = {
    name: 'test-events',
  };

  it('should require options to be passed as the first argument', function () {
    assert.throws(function () {
      var worker = new HMQEventsPublisher(undefined, function () {});
    }, HMQEventsPublisher.errors.InvalidOption);
  });

  it('should require a name option to be passed in the options object', function () {
    var opts = Object.assign({}, BASE_OPTIONS);

    delete opts.name;

    assert.throws(function () {

      var worker = new HMQEventsPublisher(opts, function () {});

    }, HMQEventsPublisher.errors.InvalidOption);
  });
});
