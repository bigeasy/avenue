require('proof')(9, async okay => {
    const Transformer = require('../transformer')
    const Queue = require('..')
    {
        const queue = new Queue(2)
        const transformer = new Transformer(queue, value => -value)
        const shifter = transformer.shifter()
        const promise = transformer.enqueue([ 1, 2, 3, null ])
        const gathered = []
        for await (const number of shifter.iterator()) {
            gathered.push(number)
        }
        await promise
        okay(gathered, [ -1, -2, -3 ], 'transformed async enqueue')
    }
    {
        const queue = new Queue
        const transformer = new Transformer(queue, value => -value)
        const shifter = transformer.shifter()
        await transformer.push(1)
        await transformer.push(null)
        okay([ await shifter.shift(), await shifter.shift() ], [ -1, null ], 'transformed async push')
    }
    {
        const queue = new Queue
        const transformer = new Transformer(queue, value => -value)
        okay(transformer.sync === transformer.sync.sync, 'sync self reference')
        okay(transformer.async === transformer, 'async self reference')
        okay(transformer.async === transformer.sync.async, 'sync async reference')
    }
    {
        const queue = new Queue
        const transformer = new Transformer(queue, value => -value)
        const shifter = transformer.shifter()
        await transformer.consume([ 1, null ])
        okay([ await shifter.shift(), await shifter.shift() ], [ -1, null ], 'transformed async consume')
    }
    {
        const queue = new Queue
        const transformer = new Transformer(queue, value => -value).sync
        const shifter = transformer.shifter()
        transformer.consume([ 1, null ])
        okay([ shifter.shift(), shifter.shift() ], [ -1, null ], 'transformed sync consume')
    }
    {
        const queue = new Queue
        const transformer = new Transformer(queue, value => -value).sync
        const shifter = transformer.shifter()
        transformer.enqueue([ 1, null ])
        okay([ shifter.shift(), shifter.shift() ], [ -1, null ], 'transformed sync enqueue')
    }
    {
        const queue = new Queue()
        const transformer = new Transformer(queue, value => -value)
        const joined = transformer.join(entry => entry == -2)
        transformer.push(1)
        transformer.push(2)
        transformer.push(null)
        okay(await joined, -2, 'shifter joined')
    }
})
