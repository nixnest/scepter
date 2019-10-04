# scepter
Spiritual successor to Nixbot

## Contributing

### Complex modules

For certain modules, you might find you need too much logic to make a single file easy to read.

Thanks to how Javascript's import system works, we allow for a module to be imported as a directory.
As an only condition, this directory requires an `index.ts` file at its root, with all the appropiate attributes (check `Module` type definition for details defined there)