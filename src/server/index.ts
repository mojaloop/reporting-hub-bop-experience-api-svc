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
// workaround for lack of typescript types for mojaloop dependencies
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../ambient.d.ts"/>
import express from 'express'
import { createProxyMiddleware, Filter, Options, RequestHandler } from 'http-proxy-middleware'

import { ServiceConfig } from '../shared/config'
import Logger from '@mojaloop/central-services-logger'

const app = express()

// proxy middleware options
const centralAdminOptions = {
  target: 'https://postman-echo.com',
  changeOrigin: true,
  pathRewrite: {
    '^/central-admin': '/'
  },
  onProxyReq: function (proxyReq: any, req: any) {
    if (!req.body || !Object.keys(req.body).length) {
      return
    }
    // const contentType = proxyReq.getHeader('Content-Type')
    const bodyData = JSON.parse(JSON.stringify(req.body))
    delete req.body
    bodyData.city = 'Hyderabad'
    const newBody = JSON.stringify(bodyData)
    proxyReq.setHeader('content-length', newBody.length)
    proxyReq.write(newBody)
    proxyReq.end()
  }
}

async function _create (config: ServiceConfig): Promise<void> {
  app.use(express.json())
  // app.use(express.urlencoded())
  app.use('/central-admin/*', createProxyMiddleware(centralAdminOptions))
  app.listen(config.PORT)
  Logger.info(`service is running on port ${config.PORT}`)
}

async function run (config: ServiceConfig): Promise<void> {
  await _create(config)
}

export default {
  run
}
