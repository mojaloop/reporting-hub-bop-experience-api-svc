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

const sampleHeaders = {
  header1: 'headervalue1'
}
const sampleBody = {
  key1: 'value1'
}

describe('addUserToExtensionList', () => {
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
})
