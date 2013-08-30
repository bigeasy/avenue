var fs = require('fs')
var path = require('path')

function parameterize (path) {
    return path.replace(/\/%/g, '/*:')
}

function routes (base, suffix) {
    var routes = []
    var dotted = '.' + suffix

    function children (base, parts) {
        var dir = path.join.apply(path, [ base ].concat(parts))
        var files = []
        var directories = []
        var start = routes.length

        fs.readdirSync(dir).sort().reverse().forEach(function (entry) {
            var file = path.join(dir, entry), stat = fs.statSync(file)
            if (stat.isDirectory()) {
                directories.push(entry)
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
                    var index = routes.length

                    if (name == 'index') {
                        if (pathInfo) {
                            index = start++
                        }
                    } else {
                        route.push(name)
                    }

                    var joined = '/' + route.join('/')

                    if (pathInfo) {
                        routes.splice(index, 0, {
                            route: parameterize((joined == '/' ? '' : joined) + '/**:pathInfo'),
                            script: parts.concat(entry).join('/'),
                            path: route.slice(),
                            file: entry,
                            name: name,
                            extension: extension.slice(0, - dotted.length)
                        })
                    }

                    routes.splice(index, 0, {
                        route: parameterize(joined),
                        script: parts.concat(entry).join('/'),
                        path: route.slice(),
                        file: entry,
                        name: name,
                        extension: extension.slice(0, - dotted.length)
                    })
                }
            }

            false && console.log({
                sorted: files,
                inserted: routes.map(function (step) { return step.script })
            })
        })

        directories.forEach(function (entry) {
            children(base, parts.concat(entry))
        })
    }

    children(base, [])

    return routes
}

module.exports = routes
