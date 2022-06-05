# TODO

- [ ] Allow shifters to create shifters from where they sit ~ I think this is done.
- [ ] In avenue a sync queue should return a sync shifter!
- [ ] We don't need to have every step of a procession be asynchronous. ~ We're
already wrapping our head around the notion that these chains are going to back
up to the entry into the program, so it is probably the case that we can have an
expedited copy where we initially dequeue, but then subsequently shift and push
to always be draining and pushing toward a bottleneck.
