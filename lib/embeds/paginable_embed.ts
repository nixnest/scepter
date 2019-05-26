import { RichEmbed } from 'discord.js'

export class PaginableEmbed extends RichEmbed {
  private perPage: number
  private paginables: Array<any>

  constructor (perPage: number, paginables: Array<any>) {
    super()
    this.perPage = perPage
    this.paginables = paginables
  }

  paginate (index: number) {
    const data = []
    this.paginables.forEach((pag: Array<any>) => {
      data.push(pag.length - 1 > index ? pag[index] : pag[pag.length - 1])
    })
    return data
  }
}

export const paginableEmbeds = new Map()
