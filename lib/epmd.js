// Connection to EPMD (Erlang Port Mapper Daemon)
// http://www.erlang.org/doc/apps/erts/erl_dist_protocol.html

'use strict';

var net = require('net');
var utf8 = require('utf8');
var utils = require('./utils');

module.exports = Epmd;

function Epmd(opts) {
  opts = opts || {};
  
  this.host = opts.host || 'localhost';
  this.port = opts.port || 4369;
  
  this.connection = null;
};

Epmd.prototype.connect = function(cb) {
  this.connection = new EpmdConnection({
    host: this.host,
    port: this.port
  });
  
  var ownPort = 9999;
  var nodeName = 'testnode';
  var extra = '';
  
  this.connection.ALIVE2_REQ(ownPort, nodeName, extra, function(err) {
    if(err) {
      return cb(err);
    }
    return cb(null);
  });
};

Epmd.prototype.close = function() {
  this.connection.ALIVE_CLOSE_REQ();
  this.connection = null;
};

// magic numbers:
var ALIVE2_REQ_CODE = 120;
var ALIVE2_RESP_CODE = 121;
var NODE_TYPE_HIDDEN = 72;
var PROTOCOL = 0; // tcp/ip-v4
var HIGHEST_VERSION = 5; // Erlang version compatibility
var LOWEST_VERSION = 5;

function EpmdConnection(opts) {
  this.host = opts.host;
  this.port = opts.port;
  this.connection = null;
};

EpmdConnection.prototype.ALIVE_CLOSE_REQ = function() {
  this.connection.end();
  this.connection = null;
};

EpmdConnection.prototype.ALIVE2_REQ = function(portNum, nodeName, extra, cb) {
  var self = this;
  var socket = new net.Socket();
  socket.on('data', function(data) {
    if(data[0] === ALIVE2_RESP_CODE) {
      self.connection = socket;
      return cb(null, socket);
    } else {
      return cb(new Error('EPMD ALIVE2_RESP error'), null);
    };
  });
  socket.on('error', function(err) {
    return cb(err, null);
  });
  socket.connect(PORT, HOST, function() {
    var payload =
      utils.packInt1(ALIVE2_REQ_CODE) +
      utils.packInt2(portNum) +
      utils.packInt1(NODE_TYPE_HIDDEN) +
      utils.packInt1(PROTOCOL) +
      utils.packInt2(HIGHEST_VERSION) +
      utils.packInt2(LOWEST_VERSION) +
      utils.packInt2(utf8.encode(nodeName).length) +
      utf8.encode(nodeName) +
      utils.packInt2(utf8.encode(extra).length) +
      utf8.encode(extra);
    
    var msg = utils.packInt2(payload.length) + payload;
    socket.write(msg);
  });
};
