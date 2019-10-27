const assert = require('assert')

module.exports = async function (readable, queue) {
    let series = 0xffff
    let remainder = Buffer.alloc(0)
    for await (const buffer of readable) {
        let byteOffset = 0
        const catenated = Buffer.concat([ remainder, buffer ])
        const enqueue = []
        for (;;) {
            const start = byteOffset
            const end = catenated.indexOf(0xa, start)
            if (~end) {
                const json = JSON.parse(buffer.slice(start, end))
                assert(json.series == (series = series + 1 & 0xffff), 'series break')
                enqueue.push(json.body)
                byteOffset = end + 1
            } else {
                remainder = buffer.slice(start)
                break
            }
        }
        await queue.enqueue(enqueue)
    }
    await queue.push(null)
}
