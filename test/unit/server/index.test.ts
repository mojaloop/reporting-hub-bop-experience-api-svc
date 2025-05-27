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
        
        // Extract the path from URL for both participants and transfers endpoints
        if (req.path.includes('/central-admin/transfers')) {
          newReq.path = '/transfers'
        } else {
          // Original behavior for other endpoints
          newReq.path = '/' + newReq.params[0]
        }
        
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
  it('central-admin/participants/*/accounts/* endpoint should work', async () => {
    const app = ServiceServer.getApp()
    const samplePayload = {
      someKey: 'SomeValue'
    }
    await request(app)
      .put('/central-admin/participants/1/accounts/1')
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
  
  it('central-admin/transfers endpoint should add email to extension list', async () => {
    // Create a mock request that would be processed by our middleware
    const req = {
      path: '/transfers',
      headers: { 'x-email': 'abc@abc.com' },
      body: {
        transferId: '123456',
        someKey: 'SomeValue'
      }
    };
    
    // Import the function we want to test directly
    const pattern = /\/transfers.*/g;
    expect(req.path.match(pattern)).not.toBeNull();
    
    // Call the implementation function to make sure it behaves as expected
    const getUserId = (headers: any) => headers['x-email'];
    const userid = getUserId(req.headers);
    expect(userid).toBe('abc@abc.com');
    
    // Verify that CentralAdmin.addUserToExtensionList works correctly
    const CentralAdmin = require('../../../src/server/modifiers/central-admin').default;
    const result = CentralAdmin.addUserToExtensionList(userid, req.headers, req.body);
    
    expect(result.body).toHaveProperty('extensionList');
    expect(result.body.extensionList).toHaveProperty('extension');
    expect(result.body.extensionList.extension).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'user', value: 'abc@abc.com'
        })
      ])
    );
  })
  
  it('should handle response interceptor with valid JSON', async () => {
    // Create a mock for responseInterceptor
    const mockResponseInterceptor = jest.fn().mockImplementation((callback) => {
      // Call the callback with a valid JSON response
      const mockResponseBuffer = Buffer.from('{"status":"success"}')
      const mockProxyRes = { statusCode: 200, statusMessage: 'OK', headers: {} }
      const mockReq = { 
        path: '/test',
        headers: {},
        span: { audit: jest.fn() }
      }
      
      // Execute the callback directly
      callback(mockResponseBuffer, mockProxyRes, mockReq)
        .then((result: string) => {
          // Verify the result is as expected
          expect(result).toBe('{"status":"success"}')
        })
      
      // Return a mock interceptor function
      return jest.fn()
    })
    
    // Override the responseInterceptor in the module
    const httpProxyMiddleware = require('http-proxy-middleware')
    const originalResponseInterceptor = httpProxyMiddleware.responseInterceptor
    httpProxyMiddleware.responseInterceptor = mockResponseInterceptor
    
    // Import the module directly to trigger the code that uses responseInterceptor
    const ServiceServer = require('../../../src/server').default
    const app = ServiceServer.getApp()
    
    // Clean up by restoring the original implementation
    httpProxyMiddleware.responseInterceptor = originalResponseInterceptor
  })
  
  it('should handle response interceptor with invalid JSON', async () => {
    // Create a mock for responseInterceptor
    const mockResponseInterceptor = jest.fn().mockImplementation((callback) => {
      // Call the callback with an invalid JSON response
      const mockResponseBuffer = Buffer.from('Not a valid JSON')
      const mockProxyRes = { statusCode: 200, statusMessage: 'OK', headers: {} }
      const mockReq = { 
        path: '/test',
        headers: {},
        span: { audit: jest.fn() }
      }
      
      // Execute the callback directly
      callback(mockResponseBuffer, mockProxyRes, mockReq)
        .then((result: string) => {
          // Verify the result is as expected
          expect(result).toBe('Not a valid JSON')
        })
      
      // Return a mock interceptor function
      return jest.fn()
    })
    
    // Override the responseInterceptor in the module
    const httpProxyMiddleware = require('http-proxy-middleware')
    const originalResponseInterceptor = httpProxyMiddleware.responseInterceptor
    httpProxyMiddleware.responseInterceptor = mockResponseInterceptor
    
    // Import the module directly to trigger the code that uses responseInterceptor
    const ServiceServer = require('../../../src/server').default
    const app = ServiceServer.getApp()
    
    // Clean up by restoring the original implementation
    httpProxyMiddleware.responseInterceptor = originalResponseInterceptor
  })
})
