const Shifter = require('./shifter')

class Sync {
    constructor (queue) {
        this.async = queue
    }

    get sync () {
        return this
    }

    get size () {
        return this.async.size
    }

    shifter () {
        return this.async.shifter().sync
    }

    // Do not awake until all values are enqueued.
    _push (value, heft) {
        const queue = this.async
        queue.size += heft
        queue._head = queue._head.next = {
            next: null,
            heft: heft,
            value: value,
            end: value == null,
            count: 0,
            shifters: 0,
            unshifters: 0
        }
    }

    push (value) {
        this._push(value, 1)
        this.async._resolve()
    }

    enqueue (values) {
        for (let value of values) {
            this._push(value, 1)
        }
        this.async._resolve()
    }

    consume (iterable, arrayed = false) {
        if (arrayed) {
            for (const entries of iterable) {
                this.enqueue(entries)
            }
        } else {
            for (const entry of iterable) {
                this.push(entry)
            }
        }
    }
}

class Queue {
    static heft = Symbol('heft')

    constructor (max = Infinity, heftify = null) {
        this.shifters = 0
        this.size = 0
        this.max = max
        this.heftify = heftify
        this._head = { next: null }
        this._shifting = []
        this._enqueuing = []
        this.sync = new Sync(this)
    }

    get async () {
        return this
    }

    shifter () {
        this._head = this._head.next = {
            next: null,
            value: null,
            end: false,
            count: 0,
            shifters: 1,
            unshifters: 0
        }
        this.shifters++
        return new Shifter(this, this._head)
    }

    _resolve () {
        if (this._shifting.length != 0) {
            for (const resolve of this._shifting.splice(0)) {
                resolve.call()
            }
        }
    }

    _twist () {
        if (this._enqueuing.length != 0 && this.size < this.max) {
            this._enqueuing.shift().call()
        }
    }

    async push (value) {
        if (this.shifters != 0) {
            await this.enqueue([ value ])
        }
    }

    async enqueue (values) {
        if (this.shifters != 0) {
            if (this.heftify == null && values.length + this.size < this.max) {
                this.sync.enqueue(values)
            } else {
                for (const value of values) {
                    const heft = this.heftify == null ? 1 : (this.heftify)(value)
                    while (this.size + heft > this.max) {
                        await new Promise(resolve => this._enqueuing.push(resolve))
                    }
                    this.sync._push(value, heft)
                    this._resolve()
                }
                if (this._enqueuing.length != 0 && this.size < this.max) {
                    this._enqueuing.shift().call()
                }
            }
        }
    }

    async join (f) {
        const shifter = this.shifter()
        const entry = await shifter.join(f)
        shifter.destroy()
        return entry
    }

    async consume (iterable, arrayed = false) {
        if (arrayed) {
            for await (const entries of iterable) {
                await this.enqueue(entries)
            }
        } else {
            for await (const entry of iterable) {
                await this.push(entry)
            }
        }
    }
}

module.exports = Queue
