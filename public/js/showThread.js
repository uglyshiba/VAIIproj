import { checkLoginStatus, displayUserProfile } from './checkSession.js'

function createCommentElement(comment) {
    const commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-container');

    const dateCreated = document.createElement('div');
    dateCreated.classList.add('date-created');
    dateCreated.textContent = comment.commentCreatedAt;

    const profilePicture = document.createElement('img');
    //const blob = new Blob([user.profilePicture], { type: 'image/jpeg' });
    profilePicture.src = 'data:image/jpeg;base64,' + comment.profilePicture.toString('base64');
    // Add logic to set profile picture if needed

    const name = document.createElement('div');
    name.classList.add('name');
    name.textContent = comment.creatorUsername;

    const commentText = document.createElement('div');
    commentText.classList.add('comment-text');
    commentText.textContent = comment.text;

    commentContainer.appendChild(dateCreated);
    commentContainer.appendChild(profilePicture);
    commentContainer.appendChild(name);
    commentContainer.appendChild(commentText);

    return commentContainer;
}

// Function to insert comments into the DOM
function insertCommentsIntoDOM(comments) {
    const threadContainer = document.querySelector('.thread-container');
    threadContainer.innerHTML = '';

    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        threadContainer.appendChild(commentElement);
    });
}



// Fetch comments from the server
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await updatePage();
        await createCommentControls();
    } catch (err) {
        console.error('Error:', err);
    }
});

async function createCommentControls() {

    // Find or create the comment-controls container
    let commentControlsContainer = document.querySelector('.comment-controls');
    if (!commentControlsContainer) {
        commentControlsContainer = document.createElement('div');
        commentControlsContainer.classList.add('comment-controls');
        document.querySelector('.thread-container').appendChild(commentControlsContainer);
    }
    const loginStatus = await checkLoginStatus();

    if (loginStatus) {
        console.log('createcommentc');

        const commentText = document.createElement('textarea');
        commentText.id = 'commentText';
        commentText.placeholder = 'Type your comment here...';

        const submitCommentBtn = document.createElement('button');
        submitCommentBtn.id = 'submitCommentBtn';
        submitCommentBtn.textContent = 'Submit Comment';
        submitCommentBtn.addEventListener('click', submitComment);

        commentControlsContainer.appendChild(commentText);
        commentControlsContainer.appendChild(submitCommentBtn);

        displayUserProfile(loginStatus);
    }
}

async function submitComment() {
    const commentText = document.getElementById('commentText').value;

    if (commentText.trim() !== '') {
        try {
            const threadId = 4;
            const response = await fetch(`http://localhost:3000/thread/${threadId}/create-comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify({ text: commentText }),
            });

            const data = await response.json();

            if (data.success) {
                await updatePage();
            } else {
                console.error('Error submitting comment:', data.error);
            }
        } catch (err) {
            console.error('Error submitting comment:', err);
        }
    }
}

async function updatePage() {
    console.log('updating page');
    const page = 1;
    const limit = 10;
    const urlParams = new URLSearchParams(window.location.search);
    const threadId = urlParams.get('threadId');
    const response = await fetch(`http://localhost:3000/thread/${threadId}?page=${page}&limit=${limit}`, {
        method: 'GET',
    });
    const data = await response.json();

    if (data.success) {
        const comments = data.threadPath;
        insertCommentsIntoDOM(comments);
    } else {
        console.error('Error fetching comments:', data.error);
    }
}