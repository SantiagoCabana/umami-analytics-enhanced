import { defineOperation } from '@/openapi/operation';
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/openapi/schemas';
import { variableRequestBody, variableResponseSchema } from './contract-schema';

export const operations = [
  defineOperation({
    method: 'get',
    path: '/api/admin/link-variables',
    audience: 'internal',
    auth: 'bearer',
    operation: {
      operationId: 'getAdminLinkVariables',
      summary: 'List destination variables (administrator or user)',
      tags: ['Administration'],
      responses: {
        '200': jsonResponse(
          variableResponseSchema.array(),
          'Destination variables ordered by name.',
        ),
        '401': unauthorizedResponse,
        '500': serverErrorResponse,
      },
    },
  }),
  defineOperation({
    method: 'post',
    path: '/api/admin/link-variables',
    audience: 'internal',
    auth: 'bearer',
    operation: {
      operationId: 'postAdminLinkVariables',
      summary: 'Create a destination variable (administrator or user)',
      tags: ['Administration'],
      requestBody: variableRequestBody,
      responses: {
        '200': jsonResponse(variableResponseSchema, 'Destination variable created.'),
        '400': badRequestResponse,
        '401': unauthorizedResponse,
        '500': serverErrorResponse,
      },
    },
  }),
] as const;
