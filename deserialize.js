'use strict'

const assert = require('assert')

module.exports = async function (readable, queue) {
    let series = 0xffff
    let remainder = Buffer.alloc(0), length = null, buffers = [], json
    for await (const buffer of readable) {
        let start = 0
        const catenated = Buffer.concat([ remainder, buffer ])
        const enqueue = []
        LOOP: for (;;) {
            if (length == null) {
                const end = catenated.indexOf(0xa, start)
                if (~end) {
                    json = JSON.parse(buffer.slice(start, end))
                    assert(json.series == (series = series + 1 & 0xffff), 'series break')
                    start = end + 1
                    length = json.length
                    if (length == null) {
                        await enqueue.push(json.body)
                    }
                } else {
                    remainder = buffer.slice(start)
                    break
                }
            } else {
                const end = Math.min(catenated.length - start, length)
                length -= end
                buffers.push(buffer.slice(start, start + end))
                start += end
                if (length == 0) {
                    length = null
                    let iterator = json
                    while (iterator.body != null) {
                        iterator = iterator.body
                    }
                    iterator.body = Buffer.concat(buffers)
                    buffers.length = 0
                    await enqueue.push(json.body)
                } else {
                    break
                }
            }
        }
        await queue.enqueue(enqueue)
    }
    await queue.push(null)
}
