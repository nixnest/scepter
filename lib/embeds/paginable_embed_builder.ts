export class PaginableEmbedBuilder {
  protected _perPage: number
  protected _paginables: Array<any>

  setPerPage (perPage: number) {
    this._perPage = perPage
    return this
  }

  setPaginables (...paginables: Array<any>) {
    this._paginables = paginables
    return this
  }
}
