// native
const util = require('util');

/**
 * Base error constructor
 * @param {String} message
 */
function HMQEventsErorr(message) {
  Error.call(this);
  
  this.message = message;
};
util.inherits(HMQEventsErorr, Error);
HMQEventsErorr.prototype.name = 'HMQEventsErorr';

/**
 * Happens when any required option is invalid
 *
 * error.option should have the option that is invalid
 * error.kind should contain details on the error type
 * 
 * @param {String} option
 * @param {String} kind
 * @param {String} message
 */
function InvalidOption(option, kind, message) {
  HMQEventsErorr.call(this, message);

  this.option = option;
  this.kind = kind;
}
util.inherits(InvalidOption, HMQEventsErorr);
InvalidOption.prototype.name = 'InvalidOption';
InvalidOption.prototype.toJSON = function () {
  return {
    name: this.name,
    option: this.option,
    kind: this.kind,
    message: this.message,
  }
};

/**
 * Happens when the server or the client receives a malformed message
 * @param {String} message
 */
function MalformedMessage(message) {
  HMQEventsErorr.call(this, message);
}
util.inherits(MalformedMessage, HMQEventsErorr);
MalformedMessage.prototype.name = 'MalformedMessage';
MalformedMessage.prototype.toJSON = function () {
  return {
    name: this.name,
    message: this.message,
  };
};

/**
 * Happens when the contentType of the message's properties is 
 * not supported by either client or server
 * @param {String} message
 */
function UnsupportedContentType(message) {
  HMQEventsErorr.call(this, message);
}
util.inherits(UnsupportedContentType, HMQEventsErorr);
UnsupportedContentType.prototype.name = 'UnsupportedContentType';
UnsupportedContentType.prototype.toJSON = function () {
  return {
    name: this.name,
    message: this.message,
  };
};

/**
 * Happens when either the server or client
 * are not connected to the rabbitMQ instance
 * @param {String} message
 */
function NotConnected(message) {
  HMQEventsErorr.call(this, message);
}
util.inherits(NotConnected, HMQEventsErorr);
NotConnected.prototype.name = 'NotConnected';

exports.HMQEventsErorr = HMQEventsErorr;
exports.InvalidOption = InvalidOption;
exports.MalformedMessage = MalformedMessage;
exports.UnsupportedContentType = UnsupportedContentType;
exports.NotConnected = NotConnected;
