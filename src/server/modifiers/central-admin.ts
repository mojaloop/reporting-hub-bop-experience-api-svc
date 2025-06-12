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

 - Vijaya Kumar Guthi <vijaya.guthi@modusbox.com>
 --------------
 ******/

import {
  Tracer,
  AuditEventAction
} from '@mojaloop/event-sdk'

enum MessageType {
  request = 'request',
  response = 'response',
  error = 'error'
}

interface CentralAdminEventContent {
  params: any;
  path: string;
  method: string;
  headers: any;
  payload: any;
  actionType: string;
  messageType: string;
  response: any;
}

interface ModifiedRequest {
  headers: any;
  body: any;
}

const addUserToExtensionList = (userid: string, headers: any, body: any): ModifiedRequest => {
  const newBody = JSON.parse(JSON.stringify(body))
  if (userid) {
    if (!newBody.extensionList) {
      newBody.extensionList = {}
    }
    if (!newBody.extensionList.extension) {
      newBody.extensionList.extension = []
    }
    newBody.extensionList.extension.push({
      key: 'user',
      value: userid
    })
  }
  return {
    headers,
    body: newBody
  }
}

const _handleAuditEvent = (req: any, res: any, messageType: string, eventType: string): void => {
  if (!req.span) {
    req.span = Tracer.createSpan('central-ledger-admin-request')
  }
  const content: CentralAdminEventContent = {
    params: {},
    path: req.path,
    method: req.method,
    headers: req.headers,
    payload: req.body,
    actionType: '',
    messageType,
    response: res
  }

  // Regular expressions for various API resources
  // eslint-disable-next-line prefer-regex-literals
  const adjustParticipantLimitsRE = new RegExp('^/participants/(.*)/limits$')
  // eslint-disable-next-line prefer-regex-literals
  const updateParticipantDetailsRE = new RegExp('^/participants/([^/]+)$')
  // eslint-disable-next-line prefer-regex-literals
  const updateParticipantAccountDetailsRE = new RegExp('^/participants/([^/]+)/accounts/([^/]+)$')

  if (adjustParticipantLimitsRE.test(req.path) && req.method === 'PUT') {
    const parsedArray = adjustParticipantLimitsRE.exec(req.path)
    req.span.audit({
      ...content,
      actionType: 'AdjustParticipantLimits',
      params: parsedArray ? { participant: parsedArray[1] } : {}
    }, eventType)
  } else if (updateParticipantDetailsRE.test(req.path) && req.method === 'PUT') {
    const parsedArray = updateParticipantDetailsRE.exec(req.path)
    req.span.audit({
      ...content,
      actionType: 'UpdateParticipantDetails',
      params: parsedArray ? { participant: parsedArray[1] } : {}
    }, eventType)
  } else if (updateParticipantAccountDetailsRE.test(req.path) && (req.method === 'PUT' || req.method === 'POST')) {
    const parsedArray = updateParticipantAccountDetailsRE.exec(req.path)
    req.span.audit({
      ...content,
      actionType: 'UpdateParticipantAccountDetails',
      params: parsedArray ? { participant: parsedArray[1], account: parsedArray[2] } : {}
    }, eventType)
  }
}

const handleRequestEvent = (req: any): void => {
  _handleAuditEvent(req, null, MessageType.request, AuditEventAction.start)
}

const handleResponseEvent = (req: any, res: any): void => {
  _handleAuditEvent(req, res, MessageType.response, AuditEventAction.finish)
}

const handleErrorResponseEvent = (req: any, errorObj: any): void => {
  _handleAuditEvent(req, errorObj, MessageType.error, AuditEventAction.finish)
}

export default {
  addUserToExtensionList,
  handleRequestEvent,
  handleResponseEvent,
  handleErrorResponseEvent
}
