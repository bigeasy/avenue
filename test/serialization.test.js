describe('serializer', () => {
    const assert = require('assert')
    const Serialize = require('../serialize')
    const Deserialize = require('../deserialize')
    const Staccato = require('staccato')
    const stream = require('stream')
    const Queue = require('..')
    it('can serialize', async () => {
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
        assert.deepStrictEqual(await shifter.shift(), { a: 1 }, 'serialized')
        assert.equal(await shifter.shift(), null, 'eoa')
    })
    it('can break on write failure', async () => {
        const outbox = new Queue
        const test = []
        const promise = Serialize(outbox.shifter(), {
            write: () => false,
            end: () => test.push('end')
        })
        outbox.push({ a: 1 })
        await promise
        assert.deepStrictEqual(test, [ 'end' ], 'ended')
    })
})
