// native
const util = require('util');
const EventEmitter = require('events').EventEmitter;

// third-party
const uuid     = require('uuid');
const Bluebird = require('bluebird');
const amqplib  = require('amqplib');

// own
const errors = require('../shared/errors');

// constants
const EVENT_QUEUE_OPTIONS = {
  exclusive: true,
  durable: false,
  autoDelete: true,
};


/**
 * Client constructor
 * 
 * @param {Object} options
 *        - name: {String}
 */
function HMQEventsConsumer(options) {
  EventEmitter.call(this);

  options = options || {};

  /**
   * Name of the events context.
   * Used to generate queue and exchange names.
   * 
   * @type {String}
   */
  this.name = options.name || this.name;

  if (!this.name) {
    throw new errors.InvalidOption('name', 'required');
  }

  this.eventsExchangeName = this.name + '-events-exchange';

  /**
   * Unique identifier of the consumer application
   * Queues will be scoped to this app id
   * 
   * @type {String}
   */
  this.appId = options.appId || uuid.v4();

  /**
   * Objects that describe each of the events
   * 
   * @param  {Array}
   */
  var events = options.events || this.events;
  if (!Array.isArray(events) || events.length === 0) {
    throw new errors.InvalidOption('events', 'required');
  }
  this.events = events.map((eventName) => {


    // the event queue name MUST be unique for
    // this consumer application
    // That is because the expected behaviour of event messages
    // is for them to be distributed among ALL consumers
    // and not load balanced among them
    // 
    // that is the main difference from h-worker's topology
    var eventQueueName = eventName + '-events-queue-' + this.appId;

    return {
      eventName: eventName,
      eventQueueName: eventQueueName
    };
  });
}
util.inherits(HMQEventsConsumer, EventEmitter);

/**
 * Expose errors
 * @type {Object}
 */
HMQEventsConsumer.errors = errors;
HMQEventsConsumer.prototype.errors = errors;

/**
 * Connects to the rabbitMQ server and ensures that
 * the required topology is set.
 * 
 * @param  {Object|String} connectionOrURI
 * @return {Bluebird -> self}
 */
HMQEventsConsumer.prototype.connect = function (connectionOrURI) {
  if (!connectionOrURI) {
    return Bluebird.reject(new errors.InvalidOption('connectionOrURI', 'required'));
  }

  var eventsExchangeName = this.eventsExchangeName;
  var events             = this.events;

  var _channel;

  var connectionPromise = (typeof connectionOrURI === 'string') ?
    Bluebird.resolve(amqplib.connect(connectionOrURI)) :
    Bluebird.resolve(connectionOrURI);

  return connectionPromise.then((connection) => {
    this.connection = connection;
    
    return connection.createChannel();
  })
  .then((channel) => {
    _channel = channel;

    var _promises = [];

    /**
     * Ensure that the topic exchange exists
     */
    _promises.push(channel.assertExchange(eventsExchangeName, 'topic'));

    /**
     * For each defined event, assert the corresponding queue
     * and bind that queue to the events exchange
     */
    events.forEach((evt) => {

      // console.log('bind queue', evt.eventQueueName);
      // console.log('to ', eventsExchangeName);
      // console.log('using rk', evt.eventName);

      _promises = _promises.concat([
        channel.assertQueue(
          evt.eventQueueName,
          EVENT_QUEUE_OPTIONS
        ),
        channel.bindQueue(
          evt.eventQueueName,
          eventsExchangeName,
          // use eventName as routing-key
          evt.eventName
        )
      ]);
    });

    return Bluebird.all(_promises);
  })
  .then(() => {

    // setup consumers
    var _promises = events.map((evt) => {
      return _channel.consume(
        evt.eventQueueName,
        // handle the consumed message
        // bind the message handling method to the instance
        // and to the eventName
        this._handleMessage.bind(this, evt.eventName)
      );
    });

    return Bluebird.all(_promises);
  })
  .then(() => {
    // save reference to the channel
    this.channel = _channel;

    return this;
  });
};

/**
 * Handles a consumed message from rabbitMQ
 * 
 * @param {String} eventName
 * @param {Buffer} message
 */
HMQEventsConsumer.prototype._handleMessage = function (eventName, message) {
  if (!message) {
    return;
  }

  var payload;

  if (message.properties.contentType === 'application/json') {
    payload = JSON.parse(message.content.toString());
  } else {
    console.warn('invalid contentType, not application/json');
    return;
  }

  /**
   * Emit the event on the instance
   */
  this.emit(eventName, payload);

  /**
   * Ack the message
   */
   this.channel.ack(message, false);
};

module.exports = HMQEventsConsumer;
