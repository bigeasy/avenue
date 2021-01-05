console.log('hello')

const heft = Symbol('heft')

const object = {
    [heft]: 1,
    a: 1
}

for (const key in object) {
    console.log('>>>', key)
}

console.log(object.hasOwnProperty(heft))
console.log(Object.getOwnPropertyNames(object))
console.log(Object.getOwnPropertySymbols(object))

console.log(object)

const a = null ?? 1

console.log(a)
