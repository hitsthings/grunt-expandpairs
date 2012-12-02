"use strict";

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

var path = require('path');
function pathNormalizeKeys(obj) {
  return Object.keys(obj).reduce(function (out, key) {
    out[path.normalize(key)] = obj[key];
    return out;
  }, {});
}

exports['expandpairs'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'helper': function(test) {
    test.expect(5);

    test.deepEqual(grunt.file.expandFilePairs({
      'out/**/*.js' : '**/*pairs.js'
    }), pathNormalizeKeys({
      'out/tasks/expand.js': [ path.normalize('tasks/expandpairs.js') ]
    }));

    test.deepEqual(grunt.file.expandFilePairs({
      'out/**/*' : 'tasks/**/*pairs.js'
    }), pathNormalizeKeys({
      'out/expandpairs.js': [ path.normalize('tasks/expandpairs.js') ]
    }));

    test.deepEqual(grunt.file.expandFilePairs({
      'out/all.ext' : 'tasks/**/*pairs.js'
    }, {
      unique : 'warn'
    }), pathNormalizeKeys({
      'out/all.ext': [ path.normalize('tasks/expandpairs.js') ]
    }));

    console.log('Expected to fail. Use --force to avoid failing.')
    test.deepEqual(grunt.file.expandFilePairs([{
      src : 'tasks/**/*pairs.js',
      dest : 'out/expand.ext'
    }, {
      src : 'tasks/**/*pairs.js',
      dest : 'out/**/*.ext',
      base : 'tasks'
    }], {
      unique: 'warn'
    }), pathNormalizeKeys({
      'out/expand.ext': [ path.normalize('tasks/expandpairs.js') ]
    }));

    test.ok(true);

    test.done();
  }
};
