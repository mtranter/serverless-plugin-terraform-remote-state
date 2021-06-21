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

export const tfStateSchema = {
  type: 'object',
  properties: {},
  additionalProperties: backendSchema
}
