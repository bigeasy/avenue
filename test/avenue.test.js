describe('avenue', () => {
    const Avenue = require('../avenue')
    const assert = require('assert')
    it('can be constructed', () => {
        const queue = new Avenue
        assert.equal(queue.size, 0, 'size')
        assert.equal(queue.max, Infinity, 'max')
    })
    it('can ignore pushes when there are no shifters', async () => {
        const queue = new Avenue
        queue.push(1)
        assert.equal(queue.size, 0, 'size')
        await queue.enqueue([ 1 ])
        assert.equal(queue.size, 0, 'size')
    })
    it('can destroy a shifter before it ever used', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        shifter.destroy()
        shifter.destroy()
    })
    it('can get shared async shifter properties through the sync interface', () => {
        const queue = new Avenue
        const shifter = queue.shifter().sync
        assert(!shifter.destroyed, 'not destroyed')
        assert(shifter.queue === queue, 'queue')
        const paired = shifter.paired
        assert(paired.queue === queue, 'paired queue')
        assert(paired.shifter === shifter, 'paired shifter')
        assert(shifter.empty, 'empty')
        assert.equal(shifter.peek(), null, 'peek')
        shifter.destroy()
    })
    it('can determine if a shifter is empty', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        queue.shifter() // create an add shifter node to skip
        assert(shifter.empty, 'is empty')
        await queue.push(null)
        assert(!shifter.empty, 'is empty')
        shifter.destroy()
        assert(shifter.empty, 'is empty')
    })
    it('can peek', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        queue.shifter() // create an add shifter node to skip
        assert.equal(shifter.peek(), null, 'is empty')
        await queue.push(1)
        assert.equal(shifter.peek(), 1, 'peek')
        await shifter.shift()
        queue.shifter() // create an add shifter node to skip
        await queue.push(null)
        assert.equal(shifter.peek(), null, 'peek end of queue')
        shifter.destroy()
        assert.equal(shifter.peek(), null, 'peek empty')
    })
    it('can construct a shifter from sync interface', async () => {
        const queue = new Avenue
        const shifter = queue.sync.shifter()
        queue.push(null)
        assert.equal(await shifter.shift(), null, 'end')
        shifter.destroy()
    })
    it('can pair a shifter with its queue', () => {
        const paired = new Avenue().shifter().paired
        assert(paired.queue != null, 'queue')
        assert(paired.shifter != null, 'shifter')
    })
    it('can push a value', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        queue.push(1)
        assert.equal(await shifter.shift(), 1, 'shifted')
        assert.equal(queue.size, 0, 'shifted size')
        shifter.destroy()
    })
    it('a shifter will wait for a pushed value', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const promise = shifter.shift()
        queue.push(1)
        assert.equal(await promise, 1, 'shifted')
        assert.equal(queue.size, 0, 'shifted size')
        shifter.destroy()
    })
    it('can enqueue many values', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        await queue.enqueue([ 1, 2, 3 ])
        assert.deepStrictEqual(await shifter.splice(3), [ 1, 2, 3 ], 'sliced')
        assert.equal(queue.size, 0, 'sliced size')
        shifter.destroy()
    })
    it('can destroy a shifter with items in queue', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        await queue.enqueue([ 1, 2, 3 ])
        assert.equal(queue.size, 3, 'enqueued size')
        assert.equal(await shifter.shift(), 1, 'shifted')
        assert.equal(queue.size, 2, 'shifted size')
        shifter.destroy()
        assert.equal(queue.shifters, 0, 'shifters remaining')
    })
    it('can destroy a shifter with other shifters outstanding', async () => {
        const queue = new Avenue
        const first = queue.shifter()
        await queue.enqueue([ 1 ])
        const second = queue.shifter()
        await queue.enqueue([ 2, 3 ])
        assert.equal(queue.size, 3, 'enqueued size')
        assert.equal(await first.shift(), 1, 'first shifted')
        assert.equal(queue.size, 2, 'shifted size')
        assert.equal(await first.shift(), 2, 'first shifted again')
        assert.equal(queue.size, 2, 'shifted size')
        first.destroy()
        assert.equal(queue.shifters, 1, 'shifters remaining')
        assert.deepStrictEqual(await second.splice(3), [ 2, 3 ], 'sliced')
        assert.equal(queue.size, 0, 'shifted size')
        second.destroy()
    })
    it('can push back on splices until drained', async () => {
        const queue = new Avenue(3)
        const shifter = queue.shifter()
        const first = queue.enqueue([ 1, 2, 3, 4, 5 ])
        const second = queue.enqueue([ 1, 2, 3, 4, 5 ])
        assert.deepStrictEqual(await shifter.splice(5), [ 1, 2, 3 ], 'first 3')
        await first
        assert.deepStrictEqual(await shifter.splice(5), [ 4, 5, 1 ], 'switching')
        assert.deepStrictEqual(await shifter.splice(5), [ 2, 3, 4 ], 'remaining')
        assert.deepStrictEqual(await shifter.splice(5), [ 5 ], 'remaining')
        await second
    })
    it('can wait on splices until enqueued', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const splice = shifter.splice(3)
        await queue.enqueue([ 1, 2, 3, 4, 5 ])
        assert.deepStrictEqual(await splice, [ 1, 2, 3 ], 'first 3')
        shifter.destroy()
    })
    it('can end of stream', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        await queue.enqueue([ 1, 2, 3, null ])
        assert.deepStrictEqual(await shifter.splice(4), [ 1, 2, 3 ], 'eos')
    })
    it('can zip up wating entries when a laggard shifter is destroyed', () => {
        const queue = new Avenue().sync
        const laggard = queue.shifter().sync
        const shifter = queue.shifter().sync
        queue.enqueue([ 1, 2, 3 ])
        assert.deepStrictEqual(shifter.splice(3), [ 1, 2, 3 ], 'spliced')
        assert.equal(queue.size, 3, 'laggard holding entries')
        laggard.destroy()
        assert.equal(queue.size, 0, 'zipped')
    })
    it('shifter iterator is iterable', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        for await (const entry of shifter.iterator()) {
            assert.equal(entry, entries.shift(), 'looped')
        }
        assert.deepStrictEqual(entries, [ null ], 'stopped before null')
    })
    it('shifter iterator is iterable by splice', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, 4, 5, 6, null ]
        await queue.enqueue(entries)
        for await (const splice of shifter.iterator(3)) {
            assert.deepStrictEqual(splice, entries.splice(0, 3), 'looped')
        }
        assert.deepStrictEqual(entries, [ null ], 'stopped before null')
    })
    it('can pump to a sync function', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        await shifter.pump((entry) => assert.equal(entry, entries.shift()))
        assert.deepStrictEqual(entries, [], 'stopped at null')
    })
    it('can pump to an async function', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        await shifter.pump(async (entry) => assert.equal(entry, entries.shift()))
        assert.deepStrictEqual(entries, [], 'stopped at null')
    })
    it('can pump splices to an sync function', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        entries.pop()
        await shifter.pump(3, (got) => assert.deepStrictEqual(got, entries.splice(0, 3)))
        assert.deepStrictEqual(entries, [], 'consumed all entries')
    })
    it('can pump splices to an async function', async () => {
        const queue = new Avenue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        entries.pop()
        await shifter.pump(3, async (got) => assert.deepStrictEqual(got, entries.splice(0, 3)))
        assert.deepStrictEqual(entries, [], 'consumed all entries')
    })
    it('can shift synchronously', () => {
        const queue = new Avenue
        const shifter = queue.shifter().sync
        queue.shifter().destroy()
        const other = queue.shifter().sync
        queue.sync.push(1)
        assert.equal(shifter.shift(), 1, 'shift')
        assert.equal(shifter.shift(), null, 'shift end of available')
        assert.equal(queue.size, 1, 'queue has items')
        assert.equal(other.shift(), 1, 'shift')
        assert.equal(queue.size, 0, 'queue is empty')
        other.destroy()
        queue.sync.push(null)
        assert.equal(shifter.shift(), null, 'shift end of queue')
        assert(shifter.destroyed, 'destroyed by end of queue')
        assert.equal(shifter.shift(), null, 'shift after destroyed')
    })
    it('can splice synchronously', () => {
        const queue = new Avenue().sync
        const shifter = queue.shifter().sync
        assert.deepStrictEqual(shifter.splice(1), [], 'empty')
        queue.enqueue([ 1, 2, 3 ])
        assert.deepStrictEqual(shifter.splice(2), [ 1, 2 ], 'hit limit')
        assert.deepStrictEqual(shifter.splice(2), [ 3 ], 'less than limit')
        shifter.destroy()
        assert.deepStrictEqual(shifter.splice(1), [], 'empty')
    })
    it('can shift iterate synchronously', () => {
        const queue = new Avenue().sync
        const shifter = queue.shifter().sync
        queue.push(1)
        const entries = []
        for (let entry of shifter.iterator()) {
            entries.push(entry)
        }
        assert.deepStrictEqual(entries, [ 1 ], 'sync iterate')
    })
    it('can splice iterate synchronously', () => {
        const queue = new Avenue().sync
        const shifter = queue.shifter().sync
        queue.enqueue([ 1, 2, 3 ])
        const entries = []
        for (let splice of shifter.iterator(2)) {
            entries.push(splice)
        }
        assert.deepStrictEqual(entries, [ [ 1, 2 ], [ 3 ]  ], 'sync iterate')
    })
})
