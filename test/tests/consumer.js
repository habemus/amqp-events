const assert = require('assert');
const should = require('should');
const Bluebird = require('bluebird');

const HMQEventsConsumer = require('../../consumer');

const aux = require('../aux');

describe('HMQEventsConsumer initialization', function () {

  beforeEach(function () {
    return aux.setup();
  });

  afterEach(function () {
    return aux.teardown();
  });

  var BASE_OPTIONS = {
    name: 'test-events',
    events: ['some-event', 'some-other-event'],
  };

  it('should require options to be passed as the first argument', function () {
    assert.throws(function () {
      var worker = new HMQEventsConsumer(undefined);
    }, HMQEventsConsumer.errors.InvalidOption);
  });

  it('should require a name option to be passed in the options object', function () {
    var opts = Object.assign({}, BASE_OPTIONS);

    delete opts.name;

    assert.throws(function () {

      var worker = new HMQEventsConsumer(opts);

    }, HMQEventsConsumer.errors.InvalidOption);
  });

  it('should require a non-empty array of events to be passed in the options object', function () {
    var opts = Object.assign({}, BASE_OPTIONS);

    delete opts.events;

    assert.throws(function () {
      var worker = new HMQEventsConsumer(opts);
    }, HMQEventsConsumer.errors.InvalidOption);
  });

  it('should correctly instantiate a consumer given the right options', function () {
    var opts = Object.assign({}, BASE_OPTIONS);

    var worker = new HMQEventsConsumer(opts);
  });
});
