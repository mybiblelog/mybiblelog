import express from 'express';
import authCurrentUser from '../helpers/authCurrentUser';
import useRepositories from '../../repositories/useRepositories';
import { type ApiResponse } from '../response';
import rateLimit from '../helpers/rateLimit';
import { validate } from '../../validation/validate';
import { feedbackBodySchema } from '../../validation/schemas/feedback';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       required:
 *         - kind
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the feedback
 *         ip:
 *           type: string
 *           description: The IP address of the user who submitted the feedback
 *         owner:
 *           type: string
 *           description: The ID of the user who submitted the feedback (if authenticated)
 *         email:
 *           type: string
 *           description: The email of the user who submitted the feedback
 *         kind:
 *           type: string
 *           description: The type of feedback
 *         message:
 *           type: string
 *           description: The feedback message
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the feedback was submitted
 */

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kind
 *               - message
 *             properties:
 *               email:
 *                 type: string
 *               kind:
 *                 type: string
 *                 description: The type of feedback
 *               message:
 *                 type: string
 *                 description: The feedback message
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */

// POST feedback form submission
router.post('/feedback', async (req, res, next) => {
  await rateLimit(req, { maxRequests: 5, windowMs: 60 * 1000 });

  try {
    // Use IP address to mitigate spam
    const ip = req.ip ?? '';

    // Get current user (optional)
    const { feedback: feedbackRepository } = await useRepositories();
    const currentUser = await authCurrentUser(req, { optional: true });

    // If the user is logged in, we can associate the feedback with their account
    const ownerId = currentUser?.id || null;

    const { body } = validate(req, { body: feedbackBodySchema });

    const feedback = await feedbackRepository.create({
      ip,
      ownerId,
      email: body.email,
      kind: body.kind,
      message: body.message,
    });

    res.status(201).send({ data: feedback } satisfies ApiResponse);
  }
  catch (error) {
    next(error);
  }
});

export default router;
