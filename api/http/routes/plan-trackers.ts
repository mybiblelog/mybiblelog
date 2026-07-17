import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { objectIdParam } from '../../validation/primitives';
import {
  planTrackerCreateSchema,
  planTrackerUpdateSchema,
  planTrackerSchema,
} from '../../validation/schemas/plan-tracker';
import {
  listPlanTrackers,
  getPlanTracker,
  createPlanTracker,
  updatePlanTracker,
  deletePlanTracker,
} from '../handlers/plan-trackers';

export const planTrackerRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/plan-trackers',
    handler: listPlanTrackers,
    docs: {
      summary: 'Get all plan trackers for the current user',
      tags: ['PlanTrackers'],
      response: { description: 'List of plan trackers', schema: z.array(planTrackerSchema) },
    },
  },
  {
    method: 'GET',
    path: '/plan-trackers/:id',
    handler: getPlanTracker,
    docs: {
      summary: 'Get a specific plan tracker by ID',
      tags: ['PlanTrackers'],
      request: { params: objectIdParam },
      response: { description: 'The plan tracker', schema: planTrackerSchema },
    },
  },
  {
    method: 'POST',
    path: '/plan-trackers',
    handler: createPlanTracker,
    docs: {
      summary: 'Start tracking a reading plan',
      tags: ['PlanTrackers'],
      request: { body: planTrackerCreateSchema },
      response: { description: 'The created plan tracker', schema: planTrackerSchema },
    },
  },
  {
    method: 'PATCH',
    path: '/plan-trackers/:id',
    handler: updatePlanTracker,
    docs: {
      summary: 'Mark a plan tracker complete or reopen it',
      tags: ['PlanTrackers'],
      request: { params: objectIdParam, body: planTrackerUpdateSchema },
      response: { description: 'The updated plan tracker', schema: planTrackerSchema },
    },
  },
  {
    method: 'DELETE',
    path: '/plan-trackers/:id',
    handler: deletePlanTracker,
    docs: {
      summary: 'Delete a plan tracker',
      tags: ['PlanTrackers'],
      request: { params: objectIdParam },
      response: { description: 'Number of deleted trackers (1)', schema: z.number() },
    },
  },
];
