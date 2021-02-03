import { tryCatch } from 'fp-ts/Either'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

export const parse = (json: string) => pipe(tryCatch(() => JSON.parse(json), e => `Expected valid JSON from TF State Store.`),
    E.chain(r => r.outputs ? E.right(r.outputs) : E.left(`Expected terraform output file to container "outputs" key. Not found`)),
    E.map(output => Object.keys(output).reduce((agg, k) => Object.assign({}, agg, { [k]: output[k].value }), {})))