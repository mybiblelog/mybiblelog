import express from 'express';

import authRouter from './routes/auth';
import settingsRouter from './routes/settings';
import adminRouter from './routes/admin';
import logEntriesRouter from './routes/log-entries';
import passageNotesRouter from './routes/passage-notes';
import passageNoteTagsRouter from './routes/passage-note-tags';
import remindersRouter from './routes/reminders';
import feedbackRouter from './routes/feedback';
import scriptureRouter from './routes/scripture';
import sitemapRouter from './routes/sitemap';

const apiRouter = express.Router();

apiRouter.use(authRouter);
apiRouter.use(settingsRouter);
apiRouter.use(adminRouter);
apiRouter.use(logEntriesRouter);
apiRouter.use(passageNotesRouter);
apiRouter.use(passageNoteTagsRouter);
apiRouter.use(remindersRouter);
apiRouter.use(feedbackRouter);
apiRouter.use(scriptureRouter);
apiRouter.use(sitemapRouter);

export default apiRouter;
