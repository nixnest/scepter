import { PaginableEmbed } from './paginable_embed'

export class StatsPaginableEmbed extends PaginableEmbed {
  channelData: Array<string>
  roleData: Array<string>

  constructor (perPage: number, paginables: Array<any>, channelData: Array<string>,
               roleData: Array<string>) {
    super(perPage, paginables)
    this.channelData = channelData
    this.roleData = roleData
    this.setUpEmbed()
  }

  setUpEmbed () {
    this.addField('roles', this.roleData[0])
    this.addField('channels', this.channelData[0])
  }
}
