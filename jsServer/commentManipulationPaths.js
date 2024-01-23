const express = require('express');
const router = express.Router();

const { runTransactionQuery, runChangeQuery } = require('./databaseFunctions');
const { insertCommentQuery} = require('./databaseQueries');
const requireLogin = require('./loginManipulationPaths');
router.post('/thread/:id/create-comment', requireLogin, async (req, res) => {
    const threadId = req.params.id;
    const { text } = req.body;

    try {
        const userId = req.session.user.id;
        await runTransactionQuery('BEGIN');
        const insertCommentResult = await runChangeQuery(insertCommentQuery, [text, userId, threadId]);

        const updateThreadQuery = `
                UPDATE thread
                SET last_user_posted = ?,
                    last_posted = CURRENT_TIMESTAMP
                WHERE id = ?;
            `;
        await runChangeQuery(updateThreadQuery, [userId, threadId]);

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

    try {
        const userId = req.session.user.id;
        await runTransactionQuery('BEGIN');
        const deleteCommentQuery = `
            DELETE FROM comment
            WHERE id = ? AND creator = ? AND thread = ?;
        `;
        await runChangeQuery(deleteCommentQuery, [commentId, userId, threadId]);
        await runTransactionQuery('COMMIT');

        res.status(200).json({ success: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err);
        await runTransactionQuery('ROLLBACK');
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;