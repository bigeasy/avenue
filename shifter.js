const assert = require('assert')

class Sync {
    constructor (shifter) {
        this.async = shifter
    }

    get queue () {
        return this.async.queue
    }
    get destroyed () {
        return this.async.destroyed
    }

    get paired () {
        return { queue: this.async.queue, shifter: this }
    }

    get empty () {
        return this.async.empty
    }

    peek () {
        return this.async.peek()
    }

    destroy () {
        return this.async.destroy()
    }

    _shift (twist) {
        const shifter = this.async
        while (shifter._head.next != null) {
            const entry = shifter._head = shifter._head.next
            if (entry.shifters != 0) {
                shifter._shifters += entry.shifters
            }
            if (entry.unshifters != 0) {
                shifter._shifters -= entry.unshifters
            }
            if (entry.value != null) {
                entry.count++
                if (entry.count == shifter._shifters) {
                    this.async.queue.size--
                    if (twist) {
                        this.async.queue._twist()
                    }
                }
                return entry.value
            } else if (entry.end) {
                this.async.destroyed = true
                this.async.queue.shifters--
                return null
            }
        }
        return null
    }

    shift () {
        if (this.async.destroyed) {
            return null
        }
        return this._shift(true)
    }

    splice (count) {
        const entries = []
        if (this.async.destroyed) {
            return entries
        }
        while (entries.length < count) {
            const entry = this._shift(false)
            if (entry == null) {
                break
            }
            entries.push(entry)
        }
        this.async.queue._twist()
        return entries
    }

    iterator (count) {
        if (count == null) {
            return {
                [Symbol.iterator]: () => {
                    return {
                        next: () => {
                            const entry = this.shift()
                            if (entry == null) {
                                return { done: true }
                            }
                            return { done: false, value: entry }
                        }
                    }
                }
            }
        }
        return {
            [Symbol.iterator]: () => {
                return {
                    next: () => {
                        const entries = this.splice(count)
                        if (entries.length == 0) {
                            return { done: true }
                        }
                        return { done: false, value: entries }
                    }
                }
            }
        }
    }
}

class Shifter {
    constructor (queue) {
        this.queue = queue
        this.destroyed = false
        this._head = queue._head
        this._resolve = () => {}
        this._shifters = queue.shifters
        this.sync = new Sync(this)
    }

    get paired () {
        return { queue: this.queue, shifter: this }
    }

    get empty () {
        if (this.destroyed) {
            return true
        }
        let iterator = this._head.next
        while (iterator != null) {
            if (iterator.value != null || iterator.end) {
                return false
            }
            iterator = iterator.next
        }
        return true
    }

    peek () {
        if (this.destroyed) {
            return null
        }
        let iterator = this._head.next
        while (iterator != null) {
            if (iterator.value != null || iterator.end) {
                return iterator.value == null ? null : iterator.value
            }
            iterator = iterator.next
        }
        return null
    }

    // TODO Here we zip to the end to account for all the entries we would have
    // consusumed, but we only need to chomp the entries that are still be held
    // for us because we're lagging. Once there is at least one more shifter
    // waiting for an entry we can stop scanning forward.
    destroy () {
        if (!this.destroyed) {
            this.queue.shifters--
            if (this.queue.shifters == 0) {
                this.queue.size = 0
            } else {
                while (this.sync._shift(false) != null) {
                }
                assert (this._head.next == null)
                this.queue._head = this.queue._head.next = {
                    next: null,
                    value: null,
                    end: false,
                    count: 0,
                    shifters: 0,
                    unshifters: 1
                }
            }
            this.queue._twist()
            this.destroyed = true
            this._resolve.call()
        }
    }

    async shift () {
        for (;;) {
            const entry = this.sync._shift(true)
            if (entry != null || this.destroyed) {
                return entry
            }
            await new Promise(resolve => this.queue._shifting.push(this._resolve = resolve))
        }
    }

    async splice (count) {
        const entries = []
        for (;;) {
            if (count == entries.length) {
                this.queue._twist()
                return entries
            }
            const entry = this.sync._shift(false)
            if (entry == null) {
                if (entries.length != 0 || this.destroyed) {
                    this.queue._twist()
                    return entries
                }
                await new Promise(resolve => this.queue._shifting.push(this._resolve = resolve))
            } else {
                entries.push(entry)
            }
        }
    }

    iterator (count) {
        if (count == null) {
            return {
                [Symbol.asyncIterator]: () => {
                    return {
                        next: async () => {
                            const value = await this.shift()
                            if (value == null) {
                                return { done: true }
                            }
                            return { value: value, done: false }
                        }
                    }
                }
            }
        }
        return {
            [Symbol.asyncIterator]: () => {
                return {
                    next: async () => {
                        const value = await this.splice(count)
                        if (value.length == 0) {
                            return { done: true }
                        }
                        return { value: value, done: false }
                    }
                }
            }
        }
    }

    async pump (...vargs) {
        const f = vargs.pop()
        const count = vargs.pop()
        if (count == null) {
            for (;;) {
                const entries = await this.splice(1)
                if (entries.length == 0) {
                    await f(null)
                    break
                } else {
                    await f(entries.shift())
                }
            }
        } else {
            for (;;) {
                const entries = await this.splice(count)
                await f(entries)
                if (entries.length == 0) {
                    break
                }
            }
        }
    }
}

module.exports = Shifter
