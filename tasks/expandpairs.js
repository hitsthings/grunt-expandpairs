"use strict";

/*
 * grunt-expandpairs
 * https://github.com/user/grunt-expandpairs
 *
 * Copyright (c) 2012 Adam Ahmed
 * Licensed under the MIT license.
 */
module.exports = function(grunt) {

var path = require('path');

var has = Object.prototype.hasOwnProperty;

// Turn { 'dest' : 'src', ... } into [{ src : 'src', dest : 'dest' }, ...]
function expandCompactedForm(pairs) {
  return grunt.utils._.map(pairs, function(src, dest) {
    return {
      src : src,
      dest : dest
    };
  });
}

function addDest(outPairs, dest, value, enforceUnique) {
  dest = path.normalize(dest);
  if (enforceUnique && has.call(outPairs, dest)) {
    var failType = enforceUnique === 'warn' ? 'warn' : 'fatal';
    grunt.fail[failType]('The destination file ' + dest + ' has been specified multiple times.');
  }
  outPairs[dest] = combineSrcs(outPairs.dest || [], value);
}

function mergePairMaps(a, b, enforceUnique) {
  var ret = grunt.utils._.clone(a);
  return Object.keys(b).reduce(function(outMap, dest) {
    addDest(outMap, dest, b[dest], enforceUnique);
    return outMap;
  }, ret);
}

function combineSrcs() {
  var srcArray = Array.prototype.reduce.call(arguments, function(srcs, src) {
    if (!grunt.utils._.isArray(src)) {
      src = [ src ];
    }
    return srcs.concat(src);
  }, []);
  return grunt.utils._.chain(srcArray).map(function(src) {
    return path.normalize(src);
  }).uniq().value();
}

function expandFilePair(destBase, destExt, src, srcBase, options) {
  src = grunt.template.process(src);
  var srcWildcardIndex = src.indexOf('*');
  var srcWildcardLastIndex = src.lastIndexOf('*');

  if (!srcBase) {
    srcBase = ~srcWildcardIndex ?
      src.substring(0, srcWildcardIndex) :
      process.cwd();
  }
  var srcExt = ~srcWildcardLastIndex ?
    src.substring(srcWildcardLastIndex + 1) :
    path.extname(src);

  var srcFiles = grunt.file.expand(src);
  return srcFiles.reduce(function(outPairs, srcFile) {
    var destFile = path.join(destBase, path.relative(srcBase, srcFile));

    // if the destination is base/**/*-suffix.ext, replace the src extension with -suffix.ext
    // otherwise, leave the src extension in place.
    if (destExt) {
      destFile = destFile.substring(0, destFile.length - srcExt.length) + destExt;
    }
    addDest(outPairs, destFile, srcFile, options && options.unique);
    return outPairs;
  }, {});
}

function expandFilePairsForDest(filePair, options) {
  var dest = grunt.template.process(filePair.dest);
  var destWildcardIndex = dest.indexOf('*');

  if (!~destWildcardIndex) {
    var ret = {};
    ret[dest] = grunt.file.expand(filePair.src);
    return ret;
  }

  var destWildcardLastIndex = dest.lastIndexOf('*');
  var destParts = {
    base : dest.substring(0, destWildcardIndex),
    wildcard : dest.substring(destWildcardIndex, destWildcardLastIndex + 1),
    ext : dest.substring(destWildcardLastIndex + 1)
  };

  if (destParts.wildcard === '*') {
    grunt.fatal('You did not specify a directory wildcard. ' +
      'File structures cannot be flattened. ' +
      'Please use a pattern like "dest/**/*-suffix.ext".');
  } else if (!/^\*\*(\\|\/)\*$/.test(destParts.wildcard)) { // Not **/* or **\*
    // TODO? Support '**' as a one-destination-per-directory mapping
    // TODO? E.g., { 'dest/**/index.js' : 'src/**/*.js' } =>
    // TODO?       { 'dest/a/index.js' : [ 'src/a/1.js', 'src/a/2.js' ] }
    grunt.fatal('You entered a complex glob as your destination. ' +
      'Only one "**/*" can appear in your pattern. (' + dest + ')');
  }

  if (!grunt.utils._.isArray(filePair.src)) {
    filePair.src = [ filePair.src ];
  }

  return filePair.src.reduce(function(outPairs, src) {
    var newPairs = expandFilePair(destParts.base, destParts.ext, src, filePair.base, options);
    return mergePairMaps(outPairs, newPairs, options && options.unique);
  }, {});
}

grunt.file.expandFilePairs = function(pairs, options) {
  if (!grunt.utils._.isArray(pairs)) {
    pairs = expandCompactedForm(pairs);
  }
  return pairs.reduce(function(outPairs, inPair) {
    var newPairs = expandFilePairsForDest(inPair, options);
    return mergePairMaps(outPairs, newPairs, options && options.unique);
  }, {});
};

};
