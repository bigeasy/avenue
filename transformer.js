const consume = require('./consume')

class Sync {
    constructor (transformer) {
        this.async = transformer
    }

    get sync () {
        return this
    }

    shifter () {
        return this.async.shifter().sync
    }

    push (value) {
        this.async._decorated.sync.push(value == null ? null : (this.async._transform)(value))
    }

    enqueue (values) {
        for (let value of values) {
            this.push(value)
        }
    }

    consume (iterable, arrayed = false) {
        consume.sync(this, iterable, arrayed)
    }
}

class Transformer {
    constructor (queue, transform) {
        this._decorated = queue.async
        this._transform = transform
        this.sync = new Sync(this)
    }

    get async () {
        return this
    }

    shifter () {
        return this._decorated.shifter()
    }

    push (value) {
        return this._decorated.push((this._transform)(value))
    }

    async enqueue (values) {
        for (const value of values) {
            const promise = this._decorated.push((this._transform)(value))
            if (promise != null) {
                await promise
            }
        }
    }

    join (f) {
        return this._decorated.join(f)
    }

    async consume (iterable, arrayed = false) {
        return consume.async(this, iterable, arrayed)
    }
}

exports.Transformer = Transformer
