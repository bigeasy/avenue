const queue = new Queue

queue.sync.push(value)
queue.sync.enqueue(values)

await queue.push(value)
await queue.enqueue(value)

const shifter = queue.shifter()

const shift = shifter.sync.shift()

for await (const splice of shifter.each(24)) {
}
