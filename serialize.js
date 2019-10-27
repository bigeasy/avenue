const EMPTY = Buffer.alloc(0)

module.exports = async function (shifter, writable, splice) {
    let series = 0xffff
    for await (const objects of shifter.iterator(splice || 64)) {
        const write = []
        for (const object of objects) {
            let buffer = EMPTY, length = null, json = { body: object }, iterator = json
            for (;;) {
                if (iterator == null || typeof iterator !== 'object') {
                    break
                }
                if (iterator.body == null) {
                    break
                }
                if (Buffer.isBuffer(iterator.body)) {
                    buffer = iterator.body
                    length = buffer.length
                    iterator.body = null
                    break
                }
                iterator = iterator.body
            }
            write.push(Buffer.from(JSON.stringify({
                series: series = series + 1 & 0xffff,
                length: length,
                body: json.body
            }) + '\n'), buffer)
        }
        if (! await writable.write(write)) {
            break
        }
    }
    writable.end()
}
