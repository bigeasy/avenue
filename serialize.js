module.exports = async function (shifter, writable, splice) {
    for await (const objects of shifter.iterator(splice || 64)) {
        const buffer = Buffer.from(objects.map(object => JSON.stringify(object)).join('\n') + '\n')
        if (! await writable.write([ buffer ])) {
            break
        }
    }
    writable.end()
}
