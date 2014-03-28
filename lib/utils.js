'use strict';

var chr = function(i) {
  return String.fromCharCode(i);
};

var packInt1 = function(i) {
  return chr(i & 255);
};

var packInt2 = function(i) {
  return chr((i >> 8) & 255) + chr((i >> 0) & 255);
};

module.exports.packInt1 = packInt1;
module.exports.packInt2 = packInt2;
