const express = require('express');
const router = express.Router();

const requireLogin = require('./loginManipulationPaths');
const { insertThreadQuery, insertCommentQuery } = require('./databaseQueries');
const { runSelectQuery, runTransactionQuery, runChangeQuery } = require('./databaseFunctions');

router.post('/create-thread', requireLogin, async (req, res) => {
    const { threadName, threadText } = req.body;

    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'User is not logged in' });
        }

        const { id: userId } = req.session.user;

        await runTransactionQuery('BEGIN');

        const createThreadResult = await runChangeQuery(insertThreadQuery, [threadName, userId, userId]);
        const threadId = createThreadResult.lastID;
        await runChangeQuery(insertCommentQuery, [threadText, userId, threadId]);

        await runTransactionQuery('COMMIT');
        res.status(200).json({ success: 'Thread created successfully', threadId: threadId });
    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to create thread' });
    }
});

router.get('/thread/:id', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const offset = (page - 1) * limit;
    const threadId = req.params.id;

    const searchThreadQuery = `
            SELECT c.id as comment_id, c.text, c.created_at as comment_created_at, c.creator as comment_creator,
                t.id as thread_id, t.title, t.created_at as thread_created_at,
                u.username as creator_username, u.profile_picture as pfp
            FROM comment c
                JOIN thread t ON c.thread = t.id
                JOIN user u ON c.creator = u.id
            WHERE t.id = ?
            ORDER BY c.created_at ASC
            LIMIT 10 OFFSET ?;
    `;

    try {
        const fetchThreadResult = await runSelectQuery(searchThreadQuery, [threadId, offset]);

        const threadResult = fetchThreadResult.map(row => ({
            commentId: row.comment_id,
            text: row.text,
            commentCreatedAt: row.comment_created_at,
            creatorId: row.comment_creator,
            threadId: row.thread_id,
            title: row.title,
            threadCreatedAt: row.thread_created_at,
            creatorUsername: row.creator_username,
            profilePicture: row.pfp ? row.pfp.toString('base64') : null
        }));

        res.status(200).json({
            success: 'Thread information retrieved successfully',
            threadPath: threadResult
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch thread information' });
    }
});

router.get('/recent-threads', async (req, res) => {
    try {
        const recentThreadsQuery = `
            SELECT threads.id AS threadId,
                   threads.title AS threadName,
                   comments.text AS lastCommentText,
                   users.username AS lastCommentCreator
            FROM thread threads
                     LEFT JOIN comment comments ON threads.id = comments.thread
                     LEFT JOIN user users ON comments.creator = users.id
            GROUP BY threads.id
            ORDER BY threads.last_posted DESC
                LIMIT 10;
        `;

        const recentThreads = await runSelectQuery(recentThreadsQuery);

        res.json({ success: true, recentThreads });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch recent threads' });
    }
});

module.exports = router;