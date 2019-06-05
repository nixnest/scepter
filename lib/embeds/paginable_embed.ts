import { RichEmbed } from 'discord.js'

export class PaginableEmbed extends RichEmbed {
  private paginables: Array<any>
  pagesCount: number

  constructor (perPage: number, paginables: Array<any>) {
    super()
    this.paginables = paginables
    this.pagesCount = 0
  }

  paginate (index: number) {
    const data = []
    this.paginables.forEach((pag: Array<any>) => {
      data.push(pag.length - 1 > index ? pag[index] : pag[pag.length - 1])

      if (data.length > this.pagesCount) {
        this.pagesCount = data.length
      }
    })
    return data
  }
}

export const paginableEmbeds = new Map()
