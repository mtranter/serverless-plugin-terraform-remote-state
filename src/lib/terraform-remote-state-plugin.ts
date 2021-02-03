import { S3 } from 'aws-sdk'
import { isRight } from 'fp-ts/Either'
import { PluginConfigCodec } from './config'
import { parse } from './state-parser'
import { fetchers } from './fetchers'

export const apply = (serverless: Serverless.Instance, options: Serverless.Options, downloaders: typeof fetchers) => async () => {
  if (!serverless.service.custom.terraformRemoteState) {
    return Promise.resolve()
  } else {
    const result = PluginConfigCodec.decode(serverless.service.custom.terraformRemoteState)
    if (isRight(result)) {
      const config = result.right
      const outputs = await Promise.all(Object.keys(config)
        .map(k => downloaders[config[k].backend](cfg => new S3({ region: cfg.config.region }))(config[k])
          .then(parse)
          .then(r => isRight(r) ? Promise.resolve(r.right) : Promise.reject(r.left))
          .then(r => ({ key: k, output: r }))))
      outputs.forEach(o => serverless.service.custom.terraformRemoteState[o.key].outputs = o.output)
    } else {
      return Promise.reject(`Bad config: ${JSON.stringify(serverless.service.custom.terraformRemoteState)}. Expected { bucket, key, region}`)
    }
  }
}

export class TerraformRemoteStatePlugin {
  hooks: { [key: string]: Function }
  pluginName: string

  constructor(private serverless: Serverless.Instance, private options: Serverless.Options) {
    const hookHandler = apply(serverless, options, fetchers)
    this.hooks = {
      'before:package:initialize': hookHandler,
      'before:remove:remove': hookHandler,
      'before:offline:start:init': hookHandler,
      'before:offline:start': hookHandler,
    }
    this.pluginName = 'serverless-plugin-terraform-remote-state'
  }
}
