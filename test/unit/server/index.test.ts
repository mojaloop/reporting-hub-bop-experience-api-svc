/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Vijay Kumar Guthi <vijaya.guthi@modusbox.com>

 --------------
 ******/
/* eslint-disable import/first */

import ServiceServer from '../../../src/server'
import request from 'supertest'
// jest.mock('http-proxy-middleware')
jest.mock('@mojaloop/event-sdk')
import {
  Tracer
} from '@mojaloop/event-sdk'

const proxyReq = {
  setHeader: jest.fn(),
  write: jest.fn(),
  end: jest.fn()
}

let mockError = false

jest.mock('http-proxy-middleware', () => {
  return {
    createProxyMiddleware: (centralAdminOptions: any) => {
      return jest.fn((req, res, next) => {
        const newReq = { ...req }
        const sampleRes = {
          statusCode: 200,
          statusMessage: 'OK',
          headers: {}
        }
        newReq.path = '/' + newReq.params[0]
        if (mockError) {
          centralAdminOptions.onError(res)
        } else {
          centralAdminOptions.onProxyReq(proxyReq, newReq)
          centralAdminOptions.onProxyRes(sampleRes, newReq, res)
        }
        next()
      })
    },
    fixRequestBody: jest.fn()
  }
})

describe('start', () => {
  beforeAll(() => {
    ServiceServer.run()
  })
  afterAll(() => {
    ServiceServer.terminate()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('health endpoint should work', async () => {
    const app = ServiceServer.getApp()
    const result = await request(app).get('/health')
    let jsonResult: any = {}
    expect(() => { jsonResult = JSON.parse(result.text) }).not.toThrowError()
    expect(result.statusCode).toEqual(200)
    expect(jsonResult).toHaveProperty('status')
    expect(jsonResult.status).toEqual('OK')
  })
  it('central-admin/participants/*/accounts/* endpoint should work', async () => {
    const app = ServiceServer.getApp()
    const samplePayload = {
      someKey: 'SomeValue'
    }
    await request(app)
      .post('/central-admin/participants/1/accounts/1')
      .send(samplePayload)
      .set('X-email', 'abc@abc.com')
    expect(Tracer.createSpan).toHaveBeenCalled()
    expect(proxyReq.setHeader).toHaveBeenCalled()
    expect(proxyReq.write).toHaveBeenCalled()
    const parsedPassedReq = JSON.parse(proxyReq.write.mock.calls[0][0])
    expect(parsedPassedReq).toHaveProperty('extensionList')
    expect(parsedPassedReq.extensionList).toHaveProperty('extension')
    expect(parsedPassedReq.extensionList.extension).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'user', value: 'abc@abc.com'
        })
      ])
    )
  })
  it('central-admin/participants/*/limits endpoint should work', async () => {
    const app = ServiceServer.getApp()
    const samplePayload = {
      someKey: 'SomeValue'
    }
    await request(app)
      .put('/central-admin/participants/1/limits')
      .send(samplePayload)
      .set('X-email', 'abc@abc.com')
    expect(Tracer.createSpan).toHaveBeenCalled()
  })
  it('central-admin/participants/* endpoint should work', async () => {
    const app = ServiceServer.getApp()
    const samplePayload = {
      someKey: 'SomeValue'
    }
    await request(app)
      .put('/central-admin/participants/1')
      .send(samplePayload)
      .set('X-email', 'abc@abc.com')
    expect(Tracer.createSpan).toHaveBeenCalled()
  })

  it('central-admin/participants endpoint with empty body', async () => {
    const app = ServiceServer.getApp()
    const result = await request(app)
      .post('/central-admin/participants/1/accounts/1')
      .set('X-email', 'abc@abc.com')
    expect(proxyReq.setHeader).not.toHaveBeenCalled()
    expect(result.status).toEqual(500)
  })
  it('central-admin/participants endpoint on error callback', async () => {
    const app = ServiceServer.getApp()
    mockError = true
    const result = await request(app)
      .post('/central-admin/participants/1/accounts/1')
      .set('X-email', 'abc@abc.com')
    expect(proxyReq.setHeader).not.toHaveBeenCalled()
    expect(result.status).toEqual(500)
  })
})
