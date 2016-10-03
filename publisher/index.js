// native
const util = require('util');
const EventEmitter = require('events').EventEmitter;

// third-party
const Bluebird = require('bluebird');
const amqplib  = require('amqplib');

// own
const errors = require('../shared/errors');

function HMQEventsPublisher(options) {
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
}
util.inherits(HMQEventsPublisher, EventEmitter);

/**
 * Expose errors
 * @type {Object}
 */
HMQEventsPublisher.errors = errors;
HMQEventsPublisher.prototype.errors = errors;

/**
 * Connects to the rabbitMQ server and ensures the required
 * topology exists
 * 
 * @param  {Object|String} connectionOrURI
 * @return {Bluebird -> self}
 */
HMQEventsPublisher.prototype.connect = function (connectionOrURI) {
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

    /**
     * The publisher does not create any queues.
     * It only ensures that the eventsExchange exists
     * so that it can publish to the exchange.
     *
     * Queues and queue binding are responsibility of consumers.
     */
    return channel.assertExchange(eventsExchangeName, 'topic');
  })
  .then(() => {
    this.channel = _channel;

    return this;
  });
};

/**
 * Private method responsible for communicating with the
 * rabbitMQ server
 * 
 * @param  {*} data
 * @param  {Object} options      
 */
HMQEventsPublisher.prototype.publish = function (routingKey, content) {

  if (!routingKey) {
    return Bluebird.reject(new errors.InvalidOption('routingKey', 'required'));
  }

  if (!content) {
    return Bluebird.reject(new errors.InvalidOption('content', 'required'));
  }

  var eventsExchangeName = this.eventsExchangeName;

  var contentType = 'application/json';

  // set default options for publishing
  options = {
    timestamp: Date.now(),
    contentType: 'application/json',
  };

  content = content || {};

  // ensure content is in buffer format
  content = new Buffer(JSON.stringify(content));

  // console.log('publish', content);
  // console.log('to exchange', this.eventsExchangeName);
  // console.log('using rk', routingKey);

  return this.channel.publish(
    this.eventsExchangeName,
    routingKey,
    content,
    options
  );
};

module.exports = HMQEventsPublisher;
