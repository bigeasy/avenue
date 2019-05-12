const Shifter = require('./shifter')

class Avenue {
    constructor (max) {
        this.shifters = 0
        this.size = 0
        this.max = max || Infinity
        this._head = { next: null }
        this._shifting = []
        this._enqueuing = []
    }

    shifter () {
        this._head = this._head.next = {
            next: null,
            value: null,
            end: false,
            count: -1,
            shifters: 1,
            unshifters: 0
        }
        this.shifters++
        return new Shifter(this)
    }

    push (value) {
        if (this.shifters != 0) {
            this._enqueue([ value ])
        }
    }

    _enqueue (values) {
        for (let value of values) {
            this.size++
            this._head = this._head.next = {
                next: null,
                value: value,
                end: value == null,
                count: 0,
                shifters: 0,
                unshifters: 0
            }
            if (this._shifting.length != 0) {
                for (let resolve of this._shifting.splice(0)) {
                    resolve.call()
                }
            }
        }
    }

    async enqueue (values) {
        if (this.shifters != 0) {
            if (values.length + this.size < this.max) {
                this._enqueue(values)
            } else {
                const remaining = values.slice()
                while (remaining.length != 0) {
                    let length = Math.min(this.max - this.size, remaining.length)
                    if (length <= 0) {
                        await new Promise(resolve => this._enqueuing.push(resolve))
                        length = Math.min(this.max - this.size, remaining.length)
                    }
                    this._enqueue(remaining.splice(0, length))
                }
                if (this._enqueuing.length != 0 && this.size < this.max) {
                    this._enqueuing.shift().call()
                }
            }
        }
    }
}

module.exports = Avenue
