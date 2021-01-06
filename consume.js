'use strict'

exports.sync = function (queue, iterable, arrayed) {
    if (arrayed) {
        for (const entries of iterable) {
            queue.enqueue(entries)
        }
    } else {
        for (const entry of iterable) {
            queue.push(entry)
        }
    }
}

exports.async = async function (queue, iterable, arrayed) {
    if (typeof iterable[Symbol.asyncIterator] == 'function') {
        if (arrayed) {
            for await (const entries of iterable) {
                for (const entry of entries) {
                    const promise = queue.push(entry)
                    if (promise != null) {
                        await promise
                    }
                }
            }
        } else {
            for await (const entry of iterable) {
                const promise = queue.push(entry)
                if (promise != null) {
                    await promise
                }
            }
        }
    } else {
        if (arrayed) {
            for (const entries of iterable) {
                for (const entry of entries) {
                    const promise = queue.push(entry)
                    if (promise != null) {
                        await promise
                    }
                }
            }
        } else {
            for (const entry of iterable) {
                const promise = queue.push(entry)
                if (promise != null) {
                    await promise
                }
            }
        }
    }
}
