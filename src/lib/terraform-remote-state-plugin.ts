import { S3 } from 'aws-sdk'
import { isRight } from 'fp-ts/Either'
import { PluginConfigCodec } from './config'
import { parse } from './state-parser'
import { fetchers } from './fetchers'
import * as get from 'lodash/get'

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

      outputs.forEach(o => {
        //serverless.service.custom.terraformRemoteState[o.key].outputs = o.output
        serverless.cli.log('fetched terraform remote state')
        serverless.cli.log(`terraform remote state ${serverless.service.custom.terraformRemoteState[o.key].outputs}`)
      })
      return outputs
    } else {
      return Promise.reject(`Bad config: ${JSON.stringify(serverless.service.custom.terraformRemoteState)}. Expected { bucket, key, region}`)
    }
  }
}

export class TerraformRemoteStatePlugin {
  hooks: { [key: string]: Function }
  pluginName: string
  configurationVariablesSources: any
  serverless: Serverless.Instance
  options: Serverless.Options
  resolvedData: {[key: string]: any}

  constructor(private serverlessI: Serverless.Instance, private opts: Serverless.Options) {
    this.serverless = serverlessI
    this.options = opts
    this.resolvedData = {}
    const hookHandler = apply(serverlessI, opts, fetchers)
    const configSchema = {
      type: 'object',
      properties: {
        bucket: { type: 'string' },
        key: { type: 'string' },
        region: { type: 'string' },
      },
      required: ['bucket', 'key'],
    }

    const backendSchema = {
      type: 'object',
      properties: {
        backend: { type: 'string' },
        config: configSchema,
      }
    }
    const newCustomPropSchema = {
      type: 'object',
      properties: {},
      additionalProperties: backendSchema
    }

    // Attach your piece of schema to main schema
    this.serverless.configSchemaHandler.defineCustomProperties(newCustomPropSchema)

    this.hooks = {
      // 'before:aws:common:validate:validate': hookHandler,
      // 'before:package:initialize': hookHandler,
      // 'before:package:finalize': hookHandler,
      // 'after:package:initialize': hookHandler,
      // 'before:deploy:deploy': hookHandler,
      // 'before:remove:remove': hookHandler,
      // 'before:offline:start:init': hookHandler,
      // 'before:offline:start': hookHandler,

      'before:print:print': hookHandler,
      'after:package:initialize': hookHandler,
      'before:offline:start': hookHandler,
      'before:offline:start:init': hookHandler
    }
    const foo = this;
    const key = 'terraformRemoteState'
    this.configurationVariablesSources = {
       [key]: {
         async resolve({address, params, resolveConfigurationProperty, options}) {
          const data  = await hookHandler()
          const bar = (data || []).reduce((acc,{key,output})=>{
            acc[key]  = {outputs: output}
            return acc
          },{})


          foo.resolvedData = bar

          const result = get(bar, address, null)
          return {
            value: result
          }
         },
       }
     }

    this.pluginName = 'serverless-plugin-terraform-remote-state'
  }
}
