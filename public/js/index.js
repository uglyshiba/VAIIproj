import { checkLoginStatus, displayUserProfile } from './checkSession.js';
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await checkLoginStatus();
        //const loginLink = document.getElementById('login-link');

        if (response) {
            const loginLink = document.getElementById('login-link');
            loginLink.href = `./showProfile.html?username=${response.username}`;
            loginLink.textContent = 'Profile';
            displayUserProfile(response);
        }

        const threadResponse = await fetch('http://localhost:3000/recent-threads', {
            method: 'GET',
        });

        const threadResponseData = await threadResponse.json();
        if(threadResponseData.success) {
            const threadContainer = document.getElementById('thread-container');
            const threads = threadResponseData.recentThreads;

            // Iterate over the first five threads or all threads if less than five
            for (let i = 0; i < Math.min(5, threads.length); i++) {
                const thread = threads[i];
                const threadDiv = document.createElement('div');
                threadDiv.classList.add('thread');

                const threadTitle = document.createElement('a');
                threadTitle.classList.add('thread-title');
                threadTitle.textContent = thread.threadName;
                threadTitle.href = `./showThread.html?threadId=${thread.threadId}`;

                const lastMessage = document.createElement('p');
                lastMessage.classList.add('last-message');
                lastMessage.textContent = `Last message: ${thread.lastCommentText || 'No comments yet'}`;

                const lastPoster = document.createElement('p');
                lastPoster.classList.add('last-poster');
                lastPoster.textContent = `By: ${thread.lastCommentCreator}`;

                threadDiv.appendChild(threadTitle);
                threadDiv.appendChild(lastMessage);
                // threadDiv.appendChild(lastPoster);
                threadContainer.appendChild(threadDiv);
            }
        } else {
            console.error('Error fetching recent threads:', threadResponseData.error);
        }
    } catch (err) {
        console.error('Error checking login status:', err);
    }
});