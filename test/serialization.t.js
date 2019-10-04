require('proof')(3, async (okay) => {
    const Serialize = require('../serialize')
    const Deserialize = require('../deserialize')
    const Staccato = require('staccato')
    const stream = require('stream')
    const Queue = require('..')
    {
        const through = new stream.PassThrough
        const readable = new Staccato.Readable(through)
        const writable = new Staccato.Writable(through)
        const outbox = new Queue
        const inbox = new Queue
        const shifter = inbox.shifter()
        const promise = {
            serialize: Serialize(outbox.shifter(), writable),
            deserialize: Deserialize(readable, inbox)
        }
        outbox.push({ a: 1 })
        outbox.push(null)
        await Promise.all([ promise.serializer, promise.deserialize ])
        okay(await shifter.shift(), { a: 1 }, 'serialized')
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
