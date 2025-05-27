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
import CentralAdmin from '../../../../src/server/modifiers/central-admin'
// jest.mock('../../src/server')
jest.mock('@mojaloop/event-sdk')
import {
  Tracer,
  AuditEventAction
} from '@mojaloop/event-sdk'

const sampleHeaders = {
  header1: 'headervalue1'
}
const sampleBody = {
  key1: 'value1'
}

// Mock for Tracer
const mockSpan = {
  audit: jest.fn()
}
Tracer.createSpan = jest.fn().mockReturnValue(mockSpan)

describe('addUserToExtensionList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return modified request', async () => {
    const result = CentralAdmin.addUserToExtensionList('123', sampleHeaders, sampleBody)
    expect(result).toHaveProperty('headers')
    expect(result).toHaveProperty('body')
    expect(result.headers).toHaveProperty('header1')
    expect(result.headers.header1).toEqual('headervalue1')
    expect(result.body).toHaveProperty('key1')
    expect(result.body.key1).toEqual('value1')
    expect(result.body).toHaveProperty('extensionList')
    expect(result.body.extensionList).toHaveProperty('extension')
    expect(Array.isArray(result.body.extensionList.extension)).toBe(true)
    // expect(result.body.extensionList.extension).toContain([expect.objectContaining({key: 'user', value: '123'})])

    // const result = await ServiceServer.run(Config)
    // expect(spyStartServer).toHaveBeenCalledTimes(1)
    // expect(result).toHaveProperty('info')
    // expect(result.info).toHaveProperty('uri')
    // expect(result.info.uri).toEqual('SOME_URI')
  })
  
  it('should handle empty userId', async () => {
    const result = CentralAdmin.addUserToExtensionList('', sampleHeaders, sampleBody)
    expect(result.body).toEqual(sampleBody)
  })
  
  it('should handle existing extensionList', async () => {
    const bodyWithExtension = {
      key1: 'value1',
      extensionList: {
        extension: [{ key: 'existingKey', value: 'existingValue' }]
      }
    }
    const result = CentralAdmin.addUserToExtensionList('123', sampleHeaders, bodyWithExtension)
    expect(result.body.extensionList.extension).toHaveLength(2)
    expect(result.body.extensionList.extension[0]).toEqual({ key: 'existingKey', value: 'existingValue' })
    expect(result.body.extensionList.extension[1]).toEqual({ key: 'user', value: '123' })
  })
  
  it('should handle existing extensionList without extension array', async () => {
    const bodyWithExtensionList = {
      key1: 'value1',
      extensionList: {}
    }
    const result = CentralAdmin.addUserToExtensionList('123', sampleHeaders, bodyWithExtensionList)
    expect(result.body.extensionList.extension).toHaveLength(1)
    expect(result.body.extensionList.extension[0]).toEqual({ key: 'user', value: '123' })
  })
})

describe('handleRequestEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should call _handleAuditEvent with request type and start action', () => {
    const req = {
      path: '/some/path',
      method: 'GET',
      headers: { header1: 'value1' },
      body: { key1: 'value1' }
    }
    
    CentralAdmin.handleRequestEvent(req)
    
    expect(Tracer.createSpan).toHaveBeenCalledWith('central-ledger-admin-request')
  })
})

describe('handleResponseEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should call _handleAuditEvent with response type and finish action', () => {
    const req = {
      path: '/some/path',
      method: 'GET',
      headers: { header1: 'value1' },
      body: { key1: 'value1' }
    }
    
    const res = {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      payload: {}
    }
    
    CentralAdmin.handleResponseEvent(req, res)
    
    expect(Tracer.createSpan).toHaveBeenCalledWith('central-ledger-admin-request')
  })
})

describe('handleErrorResponseEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should call _handleAuditEvent with error type and finish action', () => {
    const req = {
      path: '/some/path',
      method: 'GET',
      headers: { header1: 'value1' },
      body: { key1: 'value1' }
    }
    
    const errorObj = {
      errorCode: 'ERROR_CODE',
      errorMessage: 'Error message'
    }
    
    CentralAdmin.handleErrorResponseEvent(req, errorObj)
    
    expect(Tracer.createSpan).toHaveBeenCalledWith('central-ledger-admin-request')
  })
})

describe('_handleAuditEvent for various paths', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should handle adjustParticipantLimits path', () => {
    const req = {
      path: '/participants/dfsp1/limits',
      method: 'PUT',
      headers: { header1: 'value1' },
      body: { key1: 'value1' }
    }
    
    CentralAdmin.handleRequestEvent(req)
    
    expect(mockSpan.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'AdjustParticipantLimits',
        params: { participant: 'dfsp1' }
      }),
      expect.anything()
    )
  })
  
  it('should handle updateParticipantDetails path', () => {
    const req = {
      path: '/participants/dfsp1',
      method: 'PUT',
      headers: { header1: 'value1' },
      body: { key1: 'value1' }
    }
    
    CentralAdmin.handleRequestEvent(req)
    
    expect(mockSpan.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'UpdateParticipantDetails',
        params: { participant: 'dfsp1' }
      }),
      expect.anything()
    )
  })
  
  it('should handle updateParticipantAccountDetails path', () => {
    const req = {
      path: '/participants/dfsp1/accounts/1',
      method: 'PUT',
      headers: { header1: 'value1' },
      body: { key1: 'value1' }
    }
    
    CentralAdmin.handleRequestEvent(req)
    
    expect(mockSpan.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'UpdateParticipantAccountDetails',
        params: { participant: 'dfsp1', account: '1' }
      }),
      expect.anything()
    )
  })
  
  it('should handle non-matching path', () => {
    const req = {
      path: '/transfers/123',
      method: 'POST',
      headers: { header1: 'value1' },
      body: { key1: 'value1' }
    }
    
    CentralAdmin.handleRequestEvent(req)
    
    // Just verify that Tracer.createSpan was called, as non-matching paths
    // may not trigger span.audit with specific actionType
    expect(Tracer.createSpan).toHaveBeenCalledWith('central-ledger-admin-request')
    expect(req).toHaveProperty('span')
  })
  
  it('should handle existing span', () => {
    const req = {
      path: '/participants/dfsp1/limits',
      method: 'PUT',
      headers: { header1: 'value1' },
      body: { key1: 'value1' },
      span: {
        audit: jest.fn()
      }
    }
    
    CentralAdmin.handleRequestEvent(req)
    
    expect(Tracer.createSpan).not.toHaveBeenCalled()
    expect(req.span.audit).toHaveBeenCalled()
  })
})
