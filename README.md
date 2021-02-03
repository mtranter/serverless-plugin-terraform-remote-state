# Serverless Terraform Remote State Plugin

Inject terraform outputs into your Serverless config.

## Install:
`yarn add -D serverless-plugin-terraform-remote-state`
`npm add --dev serverless-plugin-terraform-remote-state`

## Usage
```yaml
service: my-service

provider:
  name: aws
  runtime: nodejs12.x
  apiGateway:
    restApiId: ${self:custom.terraformRemoteState.commonInfra.outputs.rest_api.id}
    restApiRootResourceId: ${self:custom.terraformRemoteState.commonInfra.outputs.rest_api.root_resource_id}

custom:
  terraformRemoteState:
    commonInfra:
      backend: s3
      config:
        bucket: my-state-bucket
        key: state/common/tf.state
        region: ap-southeast-2
    myService:
      backend: s3
      config:
        bucket: my-state-bucket
        key: state/my-service/tf.state
        region: ap-southeast-2

functions:
  snsListener:  
    handler: src/sns_listener.handler
    events:
      - sns:
          arn: ${self:custom.terraformRemoteState.myService.outputs.my_sns_topic.arn}

```