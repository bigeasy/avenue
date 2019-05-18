class Shifter {
    constructor (queue) {
        this.destroyed = false
        this._head = queue._head
        this.queue = queue
        this._resolve = () => {}
        this._shifters = queue.shifters
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

    destroy () {
        if (!this.destroyed) {
            this.destroyed = true
            if (this._head.next == null) {
                this._head.next = {
                    next: null,
                    value: null,
                    end: false,
                    count: 0,
                    shifters: 0,
                    unshifters: 1
                }
            } else {
                this._head.next.unshifters++
            }
            this.queue.shifters--
            this._resolve.call()
        }
    }

    async shift () {
        const splice = await this.splice(1)
        return splice.length == 1 ? splice[0] : null
    }

    _twist (size) {
        if (this.queue._enqueuing.length != 0 && size - this.queue.size != 0) {
            this.queue._enqueuing.shift().call()
        }
    }

    async splice (count) {
        const entries = []
        const size = this.queue.size
        for (;;) {
            if (this.destroyed || count == entries.length) {
                this._twist(size)
                return entries
            }
            const entry = this._head.next
            if (entry == null) {
                if (entries.length != 0) {
                    this._twist(size)
                    return entries
                }
                await new Promise(resolve => this.queue._shifting.push(this._resolve = resolve))
            }  else if (entry.end) {
                this.destroyed = true
            } else {
                this._head = this._head.next
                if (entry.value != null) {
                    entry.count++
                    entries.push(entry.value)
                }
                if (entry.shifters != 0) {
                    this._shifters += entry.shifters
                }
                if (entry.unshifters != 0) {
                    this._shifters -= entry.unshifters
                }
                if (entry.count == this._shifters) {
                    this.queue.size--
                }
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
