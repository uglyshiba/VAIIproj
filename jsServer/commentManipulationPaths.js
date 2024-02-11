const express = require('express');
const router = express.Router();

const { runTransactionQuery, runChangeQuery, runSelectQuery} = require('./databaseFunctions');
const { insertCommentQuery} = require('./databaseQueries');
const requireLogin = require('./loginManipulationPaths');
router.post('/thread/:id/create-comment', requireLogin, async (req, res) => {
    const threadId = req.params.id;
    const { text } = req.body;

    try {
        const userId = req.session.user.id;
        await runTransactionQuery('BEGIN');
        const insertCommentResult = await runChangeQuery(insertCommentQuery, [text, userId, threadId]);
        const commentId = insertCommentResult.lastID;
        const updateThreadQuery = `
                UPDATE thread
                SET last_user_posted = ?,
                    last_posted = CURRENT_TIMESTAMP,
                    last_comment = ?
                WHERE id = ?;
            `;
        await runChangeQuery(updateThreadQuery, [userId, commentId, threadId]);

        await runTransactionQuery('COMMIT');

        res.status(200).json({
            success: 'Comment created successfully'
        });
    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to process request' });
    }
});
router.put('/thread/:threadId/update-comment/:commentId', requireLogin, async (req, res) => {
    const threadId = req.params.threadId;
    const commentId = req.params.commentId;
    const { text } = req.body;

    try {
        const userId = req.session.user.id;
        await runTransactionQuery('BEGIN');
        const updateCommentQuery = `
            UPDATE comment
            SET text = ?
            WHERE id = ? AND creator = ? AND thread = ?;
        `;
        await runChangeQuery(updateCommentQuery, [text, commentId, userId, threadId]);
        await runTransactionQuery('COMMIT');

        res.status(200).json({ success: 'Comment updated successfully' });
    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

router.delete('/thread/:threadId/delete-comment/:commentId', requireLogin, async (req, res) => {
    const threadId = req.params.threadId;
    const commentId = req.params.commentId;
    let deleteCommentQuery;
    try {
        await runTransactionQuery('BEGIN');

        if(req.session.user.isAdmin) {
            deleteCommentQuery = `
                DELETE FROM comment
                WHERE id = ? AND thread = ?
            `;
            await runChangeQuery(deleteCommentQuery, [commentId, threadId]);
        } else {
            deleteCommentQuery = `
                DELETE FROM comment
                WHERE id = ? AND creator = ? AND thread = ?
            `;
            const userId = req.session.user.id;
            await runChangeQuery(deleteCommentQuery, [commentId, userId, threadId]);
        }

        const lastUserPostedQuery = `
            SELECT creator
            FROM comment
            WHERE thread = ?
            ORDER BY created_at DESC
            LIMIT 1
        `;

        const result = await runSelectQuery(lastUserPostedQuery, [threadId]);
        const lastUserPosted = result.length > 0 ? result[0].creator : null;
        const updateLastUserPostedQuery = `
            UPDATE thread SET last_user_posted = ? WHERE id = ?
        `
        await runChangeQuery(updateLastUserPostedQuery, [lastUserPosted, threadId]);

        const lastCommentQuery = `
            SELECT id FROM comment WHERE thread = ? 
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const lastCommentResult = await runSelectQuery(lastCommentQuery, [threadId]);
        const newCommentId = lastCommentResult.length > 0 ? lastCommentResult[0].id : null;
        const updateLastCommentQuery = `
            UPDATE thread SET last_comment = ? WHERE id = ?
        `;

        await runChangeQuery(updateLastCommentQuery, [newCommentId, threadId]);
        await runTransactionQuery('COMMIT');

        res.status(200).json({ success: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;