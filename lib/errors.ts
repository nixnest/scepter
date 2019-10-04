class ModuleError extends Error {
  constructor (module: string) {
    super(module)
    this.name = 'ModuleError'
  }
}

class ModuleLoadError extends ModuleError {
  constructor (module: string) {
    super(module)
    this.name = 'ModuleLoadError'
  }
}

class ModuleUnloadError extends ModuleError {
  constructor (module: string) {
    super(module)
    this.name = 'ModuleUnloadError'
  }
}
