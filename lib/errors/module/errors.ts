import { MODULE_ERROR, MODULE_LOAD_ERROR, MODULE_UNLOAD_ERROR } from './constants'

class ModuleError extends Error {
  constructor (module: string) {
    super(module)
    this.name = MODULE_ERROR
  }
}

class ModuleLoadError extends ModuleError {
  constructor (module: string) {
    super(module)
    this.name = MODULE_LOAD_ERROR
  }
}

class ModuleUnloadError extends ModuleError {
  constructor (module: string) {
    super(module)
    this.name = MODULE_UNLOAD_ERROR
  }
}
