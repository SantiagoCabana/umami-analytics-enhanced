import { defineOperation } from '@/openapi/operation';
import {
  badRequestResponse,
  jsonResponse,
  notFoundResponse,
  okSchema,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/openapi/schemas';
import {
  variablePathSchema,
  variableRequestBody,
  variableResponseSchema,
} from '../contract-schema';

export const operations = [
  defineOperation({
    method: 'post',
    path: '/api/admin/link-variables/{variableId}',
    audience: 'internal',
    auth: 'bearer',
    operation: {
      operationId: 'postAdminLinkVariablesVariableId',
      summary: 'Update a destination variable (administrator or user)',
      description:
        'Users can update the value but must keep the existing normalized name. Only administrators can rename a variable. View-only accounts cannot access variables.',
      tags: ['Administration'],
      requestParams: { path: variablePathSchema },
      requestBody: variableRequestBody,
      responses: {
        '200': jsonResponse(variableResponseSchema, 'Destination variable updated.'),
        '400': badRequestResponse,
        '401': unauthorizedResponse,
        '404': notFoundResponse,
        '500': serverErrorResponse,
      },
    },
  }),
  defineOperation({
    method: 'delete',
    path: '/api/admin/link-variables/{variableId}',
    audience: 'internal',
    auth: 'bearer',
    operation: {
      operationId: 'deleteAdminLinkVariablesVariableId',
      summary: 'Delete a destination variable (administrator or user)',
      tags: ['Administration'],
      requestParams: { path: variablePathSchema },
      responses: {
        '200': jsonResponse(okSchema, 'Destination variable deleted.'),
        '401': unauthorizedResponse,
        '404': notFoundResponse,
        '500': serverErrorResponse,
      },
    },
  }),
] as const;
