#!/usr/bin/env node

require('proof')(1, function (ok, deepEqual) {
    var find = require('../..'), fs = require('fs'), path = require('path')
    var found = find(path.join(__dirname, 'fixtures'), 'js')
    console.log(JSON.stringify(found, null, 2))
    var expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'expected.json')))
    deepEqual(expected, found, 'found')
    console.log(require('util').inspect(found, false, Infinity))
    console.log(require('util').inspect(found.map(function (step) {
        return step.script
    }), false, Infinity))
})
