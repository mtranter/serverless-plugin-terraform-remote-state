import { S3 } from 'aws-sdk'
import { RemoteStateConfig } from './config'

export const s3StateDownloader = (s3: (c: RemoteStateConfig) => S3) => (cfg: RemoteStateConfig) =>
  s3(cfg)
    .getObject({ Bucket: cfg.config.bucket, Key: cfg.config.key })
    .promise()
    .then(r => r.Body.toString())