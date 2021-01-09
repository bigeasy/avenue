'use strict'

require('proof')(113, async (okay) => {
    const Queue = require('..')
    {
        const queue = new Queue
        okay(queue.size, 0, 'constructed size')
        okay(queue.max, Infinity, 'constructed max')
    }
    {
        const queue = new Queue
        await queue.push(1)
        okay(queue.size, 0, 'no shfiters size before')
        await queue.enqueue([ 1 ])
        okay(queue.size, 0, 'no shifters size after')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        shifter.destroy()
        shifter.destroy()
        okay(shifter.destroyed, 'destroyed before use')
        okay(await shifter.shift(), null, 'destroyed before use null')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter().sync
        okay(!shifter.destroyed, 'sync not destroyed')
        okay(shifter.queue === queue, 'sync queue')
        const paired = shifter.paired
        okay(paired.queue === queue, 'sync paired queue')
        okay(paired.shifter === shifter, 'sync paired shifter')
        okay(shifter.empty, 'sync empty')
        okay(shifter.peek(), null, 'sync peek')
        shifter.destroy()
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        queue.shifter() // create an add shifter node to skip
        okay(shifter.empty, 'is empty')
        await queue.push(null)
        okay(!shifter.empty, 'is empty after eos')
        shifter.destroy()
        okay(shifter.empty, 'is empty after destroy')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        queue.shifter() // create an add shifter node to skip
        okay(shifter.peek(), null, 'is empty before peek')
        await queue.push(1)
        okay(shifter.peek(), 1, 'peek')
        await shifter.shift()
        queue.shifter() // create an add shifter node to skip
        await queue.push(null)
        okay(shifter.peek(), null, 'peek end of queue')
        shifter.destroy()
        okay(shifter.peek(), null, 'peek empty')
    }
    {
        const queue = new Queue
        const shifter = queue.sync.shifter()
        queue.push(null)
        okay(await shifter.shift(), null, 'sync shifter async clone')
        shifter.destroy()
    }
    {
        const queue = new Queue()
        const shifter = queue.shifter()
        const paired = shifter.paired
        okay(paired.queue === queue, 'paired queue')
        okay(paired.shifter === shifter, 'paired shifter')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        queue.push(1)
        okay(await shifter.shift(), 1, 'async shifted')
        okay(queue.size, 0, 'async shifted size')
        shifter.destroy()
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const promise = shifter.shift()
        queue.push(1)
        okay(await promise, 1, 'awaited shifted')
        okay(queue.size, 0, 'awaited shifted size')
        shifter.destroy()
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        await queue.enqueue([ 1, 2, 3 ])
        okay(await shifter.splice(3), [ 1, 2, 3 ], 'enqueue many sliced')
        okay(queue.size, 0, 'enqueue many sliced size')
        shifter.destroy()
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        await queue.enqueue([ 1, 2, 3 ])
        okay(queue.size, 3, 'destroy with items in queue enqueued size')
        okay(await shifter.shift(), 1, 'destroy with items in queue shifted')
        okay(queue.size, 2, 'destroy with items in queue shifted size')
        shifter.destroy()
        okay(queue.shifters, 0, 'destroy with items in queue shifters remaining')
    }
    {
        const queue = new Queue
        const first = queue.shifter()
        await queue.enqueue([ 1 ])
        const second = queue.shifter()
        await queue.enqueue([ 2, 3 ])
        okay(queue.size, 3, 'destroy with outstanding shifters enqueued size')
        okay(await first.shift(), 1, 'destroy with outstanding shifters first shifted')
        okay(queue.size, 2, 'destroy with outstanding shifters shifted size')
        okay(await first.shift(), 2, 'destroy with outstanding shifters first shifted again')
        okay(queue.size, 2, 'destroy with outstanding shifters shifted again size')
        first.destroy()
        okay(queue.shifters, 1, 'destroy with outstanding shifters remaining')
        okay(await second.splice(3), [ 2, 3 ], 'sliced')
        okay(queue.size, 0, 'destroy with outstanding shifters shifted size')
        second.destroy()
    }
    {
        const queue = new Queue(3).async
        const shifter = queue.shifter().async
        const first = queue.enqueue([ 0, 2, 4, 6, 8 ])
        const second = queue.enqueue([ 1, 3, 5, 7, 9 ])
        okay(await shifter.splice(5), [ 0, 2, 4 ], 'enqueue wait first 3')
        await first
        okay(await shifter.splice(5), [ 6, 1, 8 ], 'enqueue wait switching')
        okay(await shifter.splice(5), [ 3 ], 'enqueue wait remaining')
        okay(await shifter.splice(5), [ 5, 7, 9 ], 'enqueue wait last bit remaining')
        await second
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const splice = shifter.splice(3)
        await queue.enqueue([ 1, 2, 3, 4, 5 ])
        okay(await splice, [ 1, 2, 3 ], 'splice wait first 3')
        shifter.destroy()
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        await queue.enqueue([ 1, 2, 3, null ])
        okay(await shifter.splice(4), [ 1, 2, 3 ], 'eos')
    }
    {
        const queue = new Queue().sync.sync
        const laggard = queue.shifter()
        const shifter = queue.shifter()
        queue.enqueue([ 1, 2, 3 ])
        okay(shifter.splice(3), [ 1, 2, 3 ], 'laggard spliced')
        okay(queue.size, 3, 'laggard holding entries')
        laggard.destroy()
        okay(queue.size, 0, 'laggard zipped')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        for await (const entry of shifter.iterator()) {
            okay(entry, entries.shift(), 'async shift iterator looped')
        }
        okay(entries, [ null ], 'async shift iterator stopped before null')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        for await (const entry of shifter) {
            okay(entry, entries.shift(), 'async shift iterator looped')
        }
        okay(entries, [ null ], 'async shift iterator stopped before null')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, 4, 5, 6, null ]
        await queue.enqueue(entries)
        for await (const splice of shifter.iterator(3)) {
            okay(splice, entries.splice(0, 3), 'async splice looped')
        }
        okay(entries, [ null ], 'async splice stopped before null')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        await shifter.push((entry) => okay(entry, entries.shift(), `push sync ${entry}`))
        okay(entries, [], 'push sync stopped at null')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        await shifter.push(async (entry) => okay(entry, entries.shift(), `push async ${entry}`))
        okay(entries, [], 'push async stopped at null')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        entries.pop()
        await shifter.push(3, (got) => okay(got, entries.splice(0, 3), `push sync ${JSON.stringify(got)}`))
        okay(entries, [], 'push sync consumed all entries')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter()
        const entries = [ 1, 2, 3, null ]
        await queue.enqueue(entries)
        entries.pop()
        await shifter.push(3, async (got) => okay(got, entries.splice(0, 3), `push async ${JSON.stringify(got)}`))
        okay(entries, [], 'push async consumed all entries')
    }
    {
        const queue = new Queue
        const shifter = queue.shifter().sync
        queue.shifter().destroy()
        const other = queue.shifter().sync
        queue.sync.push(1)
        okay(shifter.shift(), 1, 'sync shift')
        okay(shifter.shift(), null, 'sync shift end of available')
        okay(queue.size, 1, 'sync shift queue has items')
        okay(other.shift(), 1, 'sync shift again ')
        okay(queue.size, 0, 'sync shift queue is empty')
        other.destroy()
        queue.sync.push(null)
        okay(shifter.shift(), null, 'sync shift shift end of queue')
        okay(shifter.destroyed, 'sync shift destroyed by end of queue')
        okay(shifter.shift(), null, 'sync shift shift after destroyed')
    }
    {
        const queue = new Queue().sync
        const shifter = queue.shifter().sync
        okay(shifter.splice(1), [], 'sync splice empty')
        queue.enqueue([ 1, 2, 3 ])
        okay(shifter.splice(2), [ 1, 2 ], 'sync splice hit limit')
        okay(shifter.splice(2), [ 3 ], 'sync splice less than limit')
        shifter.destroy()
        okay(shifter.splice(1), [], 'sync splice empty again')
    }
    {
        const queue = new Queue().sync
        const shifter = queue.shifter().sync
        queue.push(1)
        const entries = []
        for (const entry of shifter.iterator()) {
            entries.push(entry)
        }
        okay(entries, [ 1 ], 'sync shift iterate')
    }
    {
        const queue = new Queue().sync
        const shifter = queue.shifter().sync
        queue.push(1)
        const entries = []
        for (const entry of shifter) {
            entries.push(entry)
        }
        okay(entries, [ 1 ], 'sync shift iterate')
    }
    {
        const queue = new Queue().sync
        const shifter = queue.shifter().sync
        queue.enqueue([ 1, 2, 3 ])
        const entries = []
        for (const splice of shifter.iterator(2)) {
            entries.push(splice)
        }
        okay(entries, [ [ 1, 2 ], [ 3 ]  ], 'sync splice iterate')
    }
    {
        const queue = new Queue().sync
        const first = queue.shifter().sync
        const second = first.shifter().sync
        queue.enqueue([ 1, 2 ])
        okay(second.splice(2), [ 1, 2 ], 'shifter from shifter advance one')
        const third = second.shifter().sync
        queue.push(3)
        okay(second.shift(), 3, 'shifter from shifter move off from prototype')
        okay(first.splice(3), [ 1, 2, 3 ], 'shifter from shifter advance past duplicate')
        okay(queue.size, 1, 'shifter from shifter one remaining')
        okay(third.shift(), 3, 'shifter from shifter move duplciate')
        okay(queue.size, 0, 'shifter from shifter tidy')
    }
    {
        const queue = new Queue()
        const joined = queue.shifter().join(entry => entry == 2)
        queue.push(1)
        queue.push(2)
        queue.push(null)
        okay(await joined, 2, 'shifter joined')
    }
    {
        const queue = new Queue()
        const joined = queue.join(entry => entry == 2)
        queue.push(1)
        queue.push(2)
        queue.push(null)
        okay(await joined, 2, 'queue joined')
    }
    {
        // https://github.com/bigeasy/avenue/issues/49
        const queue = new Queue()
        const first = queue.shifter()
        const second = queue.shifter()
        first.destroy()
        const end = second.shift()
        queue.push(null)
        okay(await end, null, 'correctly append destruction to end of list')
    }
    {
        const queue = new Queue(7, value => value)
        const shifter = queue.shifter()
        const promise = queue.enqueue([ 5, 3 ])
        await null
        okay(queue.size, 5, 'size is based on value')
        okay(await shifter.shift(), 5, 'got pushed value')
        okay(queue.size, 3, 'size updated after shift')
        okay(await shifter.shift(), 3, 'got pushed value')
    }
    {
        const queue = new Queue(2)
        const shifter = queue.shifter().sync
        const promise = queue.consume([ 1, 2, 3 ])
        okay(await shifter.splice(4), [ 1, 2 ], 'sync consume push async first')
        okay(await shifter.splice(4), [ 3 ], 'sync consume push async second')
        await promise
    }
    {
        const queue = new Queue(2)
        const shifter = queue.shifter().sync
        const promise = queue.consume([[ 1, 2 ], [ 3 ]], true)
        okay(await shifter.splice(4), [ 1, 2 ], 'sync consume enqueue async first')
        okay(await shifter.splice(4), [ 3 ], 'sync consume enqueue async second')
        await promise
    }
    {
        const queue = new Queue(2)
        const shifter = queue.shifter()
        const promise = queue.consume(async function* () {
            for (const number of [ 1, 2, 3 ]) {
                yield number
            }
        } ())
        await new Promise(resolve => setImmediate(resolve))
        okay([ await shifter.shift(), await shifter.shift(), await shifter.shift() ], [ 1, 2, 3 ], 'async consume push async')
        await promise
    }
    {
        const queue = new Queue(2)
        const shifter = queue.shifter()
        const promise = queue.consume(async function* () {
            for (const array of [[ 1, 2 ], [ 3 ]]) {
                yield array
            }
        } (), true)
        await new Promise(resolve => setImmediate(resolve))
        okay([ await shifter.shift(), await shifter.shift(), await shifter.shift() ], [ 1, 2, 3 ], 'async consume enqueue async')
        await promise
    }
    {
        const queue = new Queue().sync
        const shifter = queue.shifter()
        queue.consume([ 1, 2, 3 ])
        okay(shifter.splice(4), [ 1, 2, 3 ], 'consume push async')
    }
    {
        const queue = new Queue().sync
        const shifter = queue.shifter().sync
        queue.consume([[ 1, 2 ], [ 3 ]], true)
        okay(shifter.splice(4), [ 1, 2, 3 ], 'consume enqueue async')
    }
    {
        const queue = new Queue().sync
        const shifter = queue.shifter()
        const gathered = []
        shifter.push(value => gathered.push(value))
        queue.enqueue([ 1, 2, 3 ])
        okay(gathered, [ 1, 2, 3 ], 'enqueue')
    }
})
