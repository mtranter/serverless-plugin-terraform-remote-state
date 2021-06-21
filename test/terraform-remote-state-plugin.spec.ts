import { apply } from '../src/lib/terraform-remote-state-plugin'
import * as stateJson from './tf-state.json'

describe('apply', () => {
    it('Should mutate the serverless config', async () => {
        const testConfig = {
            service: {
                custom: {
                    terraformRemoteState: {
                        someInfra: {
                            backend: 's3',
                            config: {
                                bucket: 'my-bucket',
                                key: 'directory/tf-state.json',
                                region: 'ap-southeast-2'
                            }
                        }
                    }
                }
            }
        }
        await apply(testConfig as unknown as Serverless.Instance, null as Serverless.Options, { s3: () => () => Promise.resolve(JSON.stringify(stateJson)) })()
        const hasOutputs: any = testConfig.service.custom.terraformRemoteState.someInfra
        expect(hasOutputs.outputs.api_v1_resource).toEqual(stateJson.outputs.api_v1_resource.value)
        expect(hasOutputs.outputs.api_admin_resource).toEqual(stateJson.outputs.api_admin_resource.value)
    })
})
