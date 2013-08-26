var fs = require('fs')
var path = require('path')

function routes (base, suffix) {
    var routes = []
    var dotted = '.' + suffix

    function children (base, parts) {
        var dir = path.join.apply(path, [ base ].concat(parts))
        var files = []

        fs.readdirSync(dir).forEach(function (entry) {
            var file = path.join(dir, entry), stat = fs.statSync(file)
            if (stat.isDirectory()) {
                children(base, parts.concat(entry))
            } else {
                files.push(entry)
            }
        })
        files.forEach(function (entry) {
            var file = path.join(dir, entry)
            var suffixed
            if (entry.lastIndexOf(dotted) == entry.length - dotted.length && entry.lastIndexOf(dotted) > 0) {
                if (entry[0] != '_') {
                    var $ = /^(.*?)(_?)\.(.*)$/.exec(entry)
                    var name = $[1]
                    var pathInfo = !! $[2]
                    var extension = $[3]
                    var route = parts.slice(0)

                    if (name != 'index') route.push(name)

                    // Note that we do not use the file system's path separator when
                    // resolving stencils.
                    routes.push({
                        route: ('/' + route.join('/')).replace(/\/%/g, '/:'),
                        script: parts.concat(entry).join('/'),
                        path: route.slice(),
                        file: entry,
                        name: name,
                        extension: extension.slice(0, - dotted.length)
                    })

                    if (pathInfo) {
                        routes.push({
                            route: '/' + route.join('/') + '/**:pathInfo',
                            script: parts.concat(entry).join('/'),
                            path: route.slice(),
                            file: entry,
                            name: name,
                            extension: extension.slice(0, - dotted.length)
                        })
                    }
                }
            }
        })
    }

    children(base, [])

    return routes
}

module.exports = routes
