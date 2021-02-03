import * as t from 'io-ts'

export const RemoteStateConfigCodec = t.type({
    backend: t.literal('s3'),
    config: t.type({
        bucket: t.readonly(t.string),
        key: t.readonly(t.string),
        region: t.readonly(t.string)
    })
})

export const PluginConfigCodec = t.record(t.readonly(t.string), RemoteStateConfigCodec)

export type RemoteStateConfig = t.TypeOf<typeof RemoteStateConfigCodec>
export type PluginConfig = t.TypeOf<typeof PluginConfigCodec>