#!/usr/bin/env node

require('proof')(1, function (ok, deepEqual) {
    var find = require('../..'), path = require('path')
    var found = find(path.join(__dirname, 'fixtures'), 'js')
    found.sort(function (a, b) { return a.path < b.path ? -1 : a.path > b.path ? 1 : 0 })
    console.log(found[0])
    deepEqual(found, [ { route: '/*:param/edit',
                         script: '%param/edit.js',
                         path: [ '%param', 'edit' ],
                         file: 'edit.js',
                         name: 'edit',
                         extension: '' },
                       { route: '/directory',
                         script: 'directory/index.get.js',
                         path: [ 'directory' ],
                         file: 'index.get.js',
                         name: 'index',
                         extension: 'get' },
                       { route: '/exact',
                         script: 'exact.js',
                         path: [ 'exact' ],
                         file: 'exact.js',
                         name: 'exact',
                         extension: '' },
                       { route: '/pathed',
                         script: 'pathed_.get.js',
                         path: [ 'pathed' ],
                         file: 'pathed_.get.js',
                         name: 'pathed',
                         extension: 'get' },
                       { route: '/pathed/**:pathInfo',
                         script: 'pathed_.get.js',
                         path: [ 'pathed' ],
                         file: 'pathed_.get.js',
                         name: 'pathed',
                         extension: 'get' } ], 'found')
})
