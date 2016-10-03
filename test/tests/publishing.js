const assert = require('assert');
const should = require('should');
const Bluebird = require('bluebird');

const HMQEventsPublisher = require('../../publisher');
const HMQEventsConsumer  = require('../../consumer');

const aux = require('../aux');

describe('event publishing', function () {

  beforeEach(function () {
    return aux.setup();
  });

  afterEach(function () {
    return aux.teardown();
  });

  var BASE_OPTIONS = {
    name: 'test-events',
  };

  it('should publish a message to all connected queues', function () {

    this.timeout(60000);

    var CONSUMER_1_PUBLISHED = {};
    var CONSUMER_2_PUBLISHED = {};
    var CONSUMER_3_PUBLISHED = {};

    var eventsScope = 'test-events';

    /**
     * Consumer 1
     * @type {HMQEventsConsumer}
     */
    var consumer1 = new HMQEventsConsumer({
      name: eventsScope,
      events: ['event-1', 'event-2', 'event-3'],
    });
    consumer1.on('event-1', (data) => {
      data.property.should.eql('event-1-value');
      CONSUMER_1_PUBLISHED['event-1'] = true;
    });
    consumer1.on('event-2', (data) => {
      data.property.should.eql('event-2-value');
      CONSUMER_1_PUBLISHED['event-2'] = true;
    });
    consumer1.on('event-3', (data) => {
      data.property.should.eql('event-3-value');
      CONSUMER_1_PUBLISHED['event-3'] = true;
    });

    /**
     * Consumer 2
     * @type {HMQEventsConsumer}
     */
    var consumer2 = new HMQEventsConsumer({
      name: eventsScope,
      events: ['event-2', 'event-3'],
    });
    consumer2.on('event-1', (data) => {
      data.property.should.eql('event-1-value');
      CONSUMER_2_PUBLISHED['event-1'] = true;
    });
    consumer2.on('event-2', (data) => {
      data.property.should.eql('event-2-value');
      CONSUMER_2_PUBLISHED['event-2'] = true;
    });
    consumer2.on('event-3', (data) => {
      data.property.should.eql('event-3-value');
      CONSUMER_2_PUBLISHED['event-3'] = true;
    });

    /**
     * Consumer 3
     * @type {HMQEventsConsumer}
     */
    var consumer3 = new HMQEventsConsumer({
      name: eventsScope,
      events: ['event-3'],
    });
    consumer3.on('event-1', (data) => {
      data.property.should.eql('event-1-value');
      CONSUMER_3_PUBLISHED['event-1'] = true;
    });
    consumer3.on('event-2', (data) => {
      data.property.should.eql('event-2-value');
      CONSUMER_3_PUBLISHED['event-2'] = true;
    });
    consumer3.on('event-3', (data) => {
      data.property.should.eql('event-3-value');
      CONSUMER_3_PUBLISHED['event-3'] = true;
    });

    var publisher = new HMQEventsPublisher({
      name: eventsScope,
    });

    return Bluebird.all([
      consumer1.connect(aux.rabbitMQURI),
      consumer2.connect(aux.rabbitMQURI),
      consumer3.connect(aux.rabbitMQURI),
      publisher.connect(aux.rabbitMQURI),
    ])
    .then(() => {

      return Bluebird.all([
        publisher.publish('event-1', {
          property: 'event-1-value',
        }),
        publisher.publish('event-2', {
          property: 'event-2-value',
        }),
        publisher.publish('event-3', {
          property: 'event-3-value',
        })
      ]);

    })
    .then(() => {
      return aux.wait(2000);
    })
    .then(() => {

      // check that consumer1 consumed all 3 events
      should(CONSUMER_1_PUBLISHED['event-1']).eql(true);
      should(CONSUMER_1_PUBLISHED['event-2']).eql(true);
      should(CONSUMER_1_PUBLISHED['event-3']).eql(true);

      // check that consumer2 consumed only event-2 and event-3
      should(CONSUMER_2_PUBLISHED['event-1']).eql(undefined);
      should(CONSUMER_2_PUBLISHED['event-2']).eql(true);
      should(CONSUMER_2_PUBLISHED['event-3']).eql(true);

      // check that consumer3 consumed only event-3
      should(CONSUMER_3_PUBLISHED['event-1']).eql(undefined);
      should(CONSUMER_3_PUBLISHED['event-2']).eql(undefined);
      should(CONSUMER_3_PUBLISHED['event-3']).eql(true);

      return aux.wait(50000);

    });

  });
});
