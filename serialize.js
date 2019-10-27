module.exports = async function (shifter, writable, splice) {
    let series = 0xffff
    for await (const objects of shifter.iterator(splice || 64)) {
        const buffer = Buffer.from(objects.map(object => {
            return JSON.stringify({
                series: series = series + 1 & 0xffff,
                body: object
            })
        }).join('\n') + '\n')
        if (! await writable.write([ buffer ])) {
            break
        }
    }
    writable.end()
}
