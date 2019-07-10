module.exports = async function (readable, queue) {
    let remainder = Buffer.alloc(0)
    for await (const buffer of readable) {
        let byteOffset = 0
        const catenated = Buffer.concat([ remainder, buffer ])
        const enqueue = []
        for (;;) {
            const start = byteOffset
            const end = catenated.indexOf(0xa, start)
            if (~end) {
                enqueue.push(JSON.parse(buffer.slice(start, end)))
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
