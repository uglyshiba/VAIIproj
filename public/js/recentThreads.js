document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/recent-threads', {
            method: 'GET',
        });

        const data = await response.json();

        if (data.success) {
            const recentThreadsContainer = document.querySelector('.recent-threads-container');

            data.recentThreads.forEach(thread => {
                const threadCard = document.createElement('div');
                threadCard.classList.add('thread-card');

                const threadLink = document.createElement('a');
                threadLink.href = `./showThread.html?threadId=${thread.threadId}`;
                threadLink.textContent = thread.threadName;

                const lastComment = document.createElement('div');
                lastComment.classList.add('last-comment');
                lastComment.textContent = `Last Comment: ${thread.lastCommentText || 'No comments yet'}`;

                const lastCommentCreator = document.createElement('div');
                lastCommentCreator.classList.add('last-comment-creator');
                lastCommentCreator.textContent = `By: ${thread.lastCommentCreator || 'Unknown'}`;

                threadCard.appendChild(threadLink);
                threadCard.appendChild(lastComment);
                threadCard.appendChild(lastCommentCreator);

                recentThreadsContainer.appendChild(threadCard);
            });
        } else {
            console.error('Error fetching recent threads:', data.error);
        }
    } catch (err) {
        console.error('Error fetching recent threads:', err);
    }
});