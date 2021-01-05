'use strict'

require('proof')(5, async (okay) => {
    const Serialize = require('../serialize')
    const Deserialize = require('../deserialize')
    const Staccato = require('staccato')
    const stream = require('stream')
    const Queue = require('..')
    {
        const to = new stream.PassThrough
        const from = new stream.PassThrough
        const writable = new Staccato.Writable(to)
        const readable = new Staccato.Readable(from)
        const outbox = new Queue
        const serialized = Serialize(outbox.shifter(), writable)
        outbox.push(Buffer.from('x\n'))
        outbox.push({ body: Buffer.from('x\n') })
        outbox.push({ body: 1 })
        outbox.push(null)
        await serialized
        const inbox = new Queue
        const shifter = inbox.shifter()
        const deserialized = Deserialize(readable, inbox)
        const wrote = to.read().toString()
        from.write(wrote.substring(0, 37))
        await new Promise(resolve => setImmediate(resolve))
        from.write(wrote.substring(37))
        from.end()
        await deserialized
        okay((await shifter.shift()).toString(), 'x\n', 'serialized buffer')
        okay((await shifter.shift()).body.toString(), 'x\n', 'serialized nested buffer')
        okay(await shifter.shift(), { body: 1 }, 'serialized')
        okay(await shifter.shift(), null, 'eoa')
    }
    {
        const outbox = new Queue
        const test = []
        const promise = Serialize(outbox.shifter(), {
            write: () => false,
            end: () => test.push('end')
        })
        outbox.push({ a: 1 })
        await promise
        okay(test, [ 'end' ], 'write failure ended')
    }
})
