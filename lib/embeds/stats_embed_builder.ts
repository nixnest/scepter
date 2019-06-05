import { PaginableEmbedBuilder } from './paginable_embed_builder'
import { StatsPaginableEmbed } from './stats_embed'
import { chunkArray } from '../helpers/array'

export class StatsPaginableEmbedBuilder extends PaginableEmbedBuilder {
  private _channelData: Array<string>
  private _roleData: Array<string>

  makeChannels (data): StatsPaginableEmbedBuilder {
    const key = 'channels'
    const channelsData = Object.entries(data.fields[key])
    this._channelData = chunkArray(channelsData.map(x => {  // TODO: figure out a way to clean this up
      return `\n${x[0]}: ${chunkArray((x[1] as []).map(y => {  // Each category...
        return `\n\t${y[1]} (${y[0]}): ${y[2]}`  // Each channel in said category...
      }), this._perPage)}`
    }), this._perPage)
    return this
  }

  makeRoles (data): StatsPaginableEmbedBuilder {
    const key = 'roles'
    this._roleData = chunkArray(
      data.fields[key].map(x => `${x[1]} (${x[0]}): ${x[2]} members`),
      this._perPage
    )
    return this
  }

  setPaginables () {
    return super.setPaginables(this._roleData, this._channelData)
  }

  build (): StatsPaginableEmbed {
    return new StatsPaginableEmbed(this._perPage, this._paginables, this._channelData, this._roleData)
  }
}
