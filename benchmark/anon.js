const FUNCTIONS = 100
const COUNT = 1000000

const functions = []

for (let i = 0; i < FUNCTIONS; i++) {
    const o = { f: function () {} }
//    o['a' + i] = 1
    functions.push(o)
}

function call (object) {
    object.f.call(null)
}

function dereference (object) {
    (object.f)()
}

{
    const start = Date.now()
    for (let j = 0; j < COUNT; j++) {
        for (let i = 0, I = functions.length; i < I; i++) {
            call(functions[i])
        }
    }
    console.log(Date.now() - start)
}

{
    const start = Date.now()
    for (let j = 0; j < COUNT; j++) {
        for (let i = 0, I = functions.length; i < I; i++) {
            dereference(functions[i])
        }
    }
    console.log(Date.now() - start)
}
