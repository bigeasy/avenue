[![Actions Status](https://github.com/bigeasy/avenue/workflows/Node%20CI/badge.svg)](https://github.com/bigeasy/avenue/actions)
[![codecov](https://codecov.io/gh/bigeasy/avenue/branch/master/graph/badge.svg)](https://codecov.io/gh/bigeasy/avenue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An async/await event queue.

| What          | Where                                         |
| --- | --- |
| Discussion    | https://github.com/bigeasy/avenue/issues/1    |
| Documentation | https://bigeasy.github.io/avenue              |
| Source        | https://github.com/bigeasy/avenue             |
| Issues        | https://github.com/bigeasy/avenue/issues      |
| CI            | https://travis-ci.org/bigeasy/avenue          |
| Coverage:     | https://codecov.io/gh/bigeasy/avenue          |
| License:      | MIT                                           |

```text
npm install avenue
```

## Overview

Avenue implements a queue as a disintegrating linked-list.

Avenue provides a `Queue` class. When you push onto the head of the `Queue` a
new element is added to the head of the list. The queue itself does not maintain
a pointer to the tail.

To remove items from the queue you must first create a `Shifter` by calling
`Queue.shifter()`. This will be created with a reference to the current head of
the list, in order to reference the next item in the list. At this point if you
where to call the synchronous `Shifter.shift()` you would get a `null` return
value because the next value of the head of the list is `null`.

When you push a new element onto the head of the `Queue`, it will become visible
to the `Shifter`. A call to the synchronous `Shifter.shift()` will return the
item. After the shifter returns the item it advances its tail node to the next
node that contained the value returned. The previous node is no longer
referenced by the `Queue` nor the `Shifter` so it is garbage collected.

You can have multiple `Shifter`s for a single `Queue` garbage collection occurs
when the all the `Shifter`s `shift` past a node in the `Queue`.

If there are no `Shifter`s for a queue, then any push onto the `Queue` is
effectively a no-op. The element is discarded the next time item an item is
pushed.

This `README.md` is also a unit test using the
[Proof](https://github.com/bigeasy/proof) unit test framework. We'll use the
Proof `okay` function to assert out statements in the readme. A Proof unit test
generally looks like this.

```javascript
require('proof')(4, async okay => {
    okay('always okay')
    okay(true, 'okay if true')
    okay(1, 1, 'okay if equal')
    okay({ value: 1 }, { value: 1 }, 'okay if deep strict equal')
})
```

You can run this unit test yourself to see the output from the various
code sections of the readme.

```text
git clone git@github.com:bigeasy/avenue.git
cd avenue
npm install --no-package-lock --no-save
node test/readme.t.js
```

The `'avenue'` module exports a single `Queue` object.

```javascript
const { Queue } = require('avenue')
```

If you want to stream a shifter into a queue with back-pressure you can the
`Shifter.async.push()` method.

```javascript
const from = new Queue
const to = new Queue
const shifter = to.shifter()
const promise = from.shifter().push(value => to.push(value))
await from.enqueue([ 1, 2, 3, null ])
await promise
okay(shifter.sync.splice(4), [ 1, 2, 3 ], 'pushed')
okay(shifter.destroyed, 'pumped received terminator')
```

If you want to stream a shifter into a queue without terminating the queue you
use `Queue.consume`.

```javascript
const from = new Queue
const to = new Queue
const shifter = to.shifter()
const promise = to.consume(from.shifter())
await from.enqueue([ 1, 2, 3, null ])
await promise
okay(shifter.sync.splice(4), [ 1, 2, 3 ], 'pushed')
okay(!shifter.destroyed, 'consumed did not receive terminator')
```
