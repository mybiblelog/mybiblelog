import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { objectIdParam } from '../../validation/primitives';
import {
  readingPlanCreateSchema,
  readingPlanUpdateSchema,
  readingPlanSchema,
} from '../../validation/schemas/reading-plan';
import {
  listReadingPlans,
  getReadingPlan,
  createReadingPlan,
  updateReadingPlan,
  deleteReadingPlan,
} from '../handlers/reading-plans';

export const readingPlanRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/reading-plans',
    handler: listReadingPlans,
    docs: {
      summary: 'Get all reading plans for the current user',
      tags: ['ReadingPlans'],
      response: { description: 'List of reading plans', schema: z.array(readingPlanSchema) },
    },
  },
  {
    method: 'GET',
    path: '/reading-plans/:id',
    handler: getReadingPlan,
    docs: {
      summary: 'Get a specific reading plan by ID',
      tags: ['ReadingPlans'],
      request: { params: objectIdParam },
      response: { description: 'The reading plan', schema: readingPlanSchema },
    },
  },
  {
    method: 'POST',
    path: '/reading-plans',
    handler: createReadingPlan,
    docs: {
      summary: 'Create a new reading plan',
      tags: ['ReadingPlans'],
      request: { body: readingPlanCreateSchema },
      response: { description: 'The created reading plan', schema: readingPlanSchema },
    },
  },
  {
    method: 'PATCH',
    path: '/reading-plans/:id',
    handler: updateReadingPlan,
    docs: {
      summary: 'Update a reading plan',
      tags: ['ReadingPlans'],
      request: { params: objectIdParam, body: readingPlanUpdateSchema },
      response: { description: 'The updated reading plan', schema: readingPlanSchema },
    },
  },
  {
    method: 'DELETE',
    path: '/reading-plans/:id',
    handler: deleteReadingPlan,
    docs: {
      summary: 'Delete a reading plan',
      tags: ['ReadingPlans'],
      request: { params: objectIdParam },
      response: { description: 'Number of deleted plans (1)', schema: z.number() },
    },
  },
];
