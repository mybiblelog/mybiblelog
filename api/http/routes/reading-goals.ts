import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { objectIdParam } from '../../validation/primitives';
import { readingGoalBodySchema, readingGoalSchema } from '../../validation/schemas/reading-goal';
import {
  listReadingGoals,
  getReadingGoal,
  createReadingGoal,
  updateReadingGoal,
  deleteReadingGoal,
} from '../handlers/reading-goals';

/**
 * Framework-neutral route table for reading goals. All routes require an
 * authenticated user (401 otherwise). See `api/http/openapi/generate.ts`.
 */
const tags = ['ReadingGoals'];

export const readingGoalRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/reading-goals',
    handler: listReadingGoals,
    docs: {
      summary: 'Get all reading goals for the current user',
      tags,
      response: { description: 'List of reading goals', schema: z.array(readingGoalSchema) },
      errors: [401],
    },
  },
  {
    method: 'GET',
    path: '/reading-goals/:id',
    handler: getReadingGoal,
    docs: {
      summary: 'Get a specific reading goal by ID',
      tags,
      request: { params: objectIdParam },
      response: { description: 'The reading goal', schema: readingGoalSchema },
      errors: [400, 401, 404],
    },
  },
  {
    method: 'POST',
    path: '/reading-goals',
    handler: createReadingGoal,
    docs: {
      summary: 'Create a new reading goal',
      tags,
      request: { body: readingGoalBodySchema },
      response: { description: 'The created reading goal', schema: readingGoalSchema },
      errors: [400, 401],
    },
  },
  {
    method: 'PATCH',
    path: '/reading-goals/:id',
    handler: updateReadingGoal,
    docs: {
      summary: 'Update a reading goal (full replacement)',
      tags,
      request: { params: objectIdParam, body: readingGoalBodySchema },
      response: { description: 'The updated reading goal', schema: readingGoalSchema },
      errors: [400, 401, 404],
    },
  },
  {
    method: 'DELETE',
    path: '/reading-goals/:id',
    handler: deleteReadingGoal,
    docs: {
      summary: 'Delete a reading goal',
      tags,
      request: { params: objectIdParam },
      response: { description: 'Number of deleted goals (1)', schema: z.number() },
      errors: [400, 401, 404],
    },
  },
];
