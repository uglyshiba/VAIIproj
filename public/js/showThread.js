import { checkLoginStatus, displayUserProfile } from './checkSession.js'

function createCommentElement(comment, loginStatus) {
    const commentContainer = document.createElement('div');
    commentContainer.classList.add('comment-container');

    const dateCreated = document.createElement('div');
    dateCreated.classList.add('date-created');
    dateCreated.textContent = comment.commentCreatedAt;

    const profilePicture = document.createElement('img');

    if (comment.profilePicture !== null) {
        profilePicture.src = 'data:image/jpeg;base64,' + comment.profilePicture.toString('base64');
    } else {
        profilePicture.src = './resources/images/deleted_user_pfp.png';
    }

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

    if ((loginStatus && (loginStatus.id === comment.creatorId)) || (loginStatus.is_admin)) {
        const buttonRow = document.createElement('div');
        buttonRow.classList.add('button-row');

        if(!loginStatus.is_admin || (loginStatus.is_admin && loginStatus.id === comment.creatorId)) {
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => {
                editComment(commentText, comment);
            });

            buttonRow.appendChild(editButton);
        }

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteComment(comment.threadId, comment.commentId);
        });

        buttonRow.appendChild(deleteButton);

        commentContainer.appendChild(buttonRow);
    }

    return commentContainer;
}

// Function to insert comments into the DOM
function insertCommentsIntoDOM(comments, loginStatus) {
    const threadContainer = document.querySelector('.thread-container');
    threadContainer.innerHTML = '';

    comments.forEach(comment => {
        const commentElement = createCommentElement(comment, loginStatus);
        threadContainer.appendChild(commentElement);
    });
}



// Fetch comments from the server
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await updatePage();
    } catch (err) {
        console.error('Error:', err);
    }
});

async function createCommentControls(loginStatus) {
    let commentControlsContainer = document.querySelector('.comment-controls');
    if (!commentControlsContainer) {
        commentControlsContainer = document.createElement('div');
        commentControlsContainer.classList.add('comment-controls');
        document.querySelector('.thread-container').appendChild(commentControlsContainer);
    }

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

    }
}

async function submitComment() {
    const commentText = document.getElementById('commentText').value;

    if (commentText.trim() !== '') {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const threadId = urlParams.get('threadId');
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
        const loginStatus = await checkLoginStatus();
        displayUserProfile(loginStatus);
        insertCommentsIntoDOM(comments, loginStatus);
        await createCommentControls(loginStatus);
    } else {
        console.error('Error fetching comments:', data.error);
    }
}

async function deleteComment(threadId, commentId) {
    try {
        const response = await fetch(`http://localhost:3000/thread/${threadId}/delete-comment/${commentId}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        const data = await response.json();

        if (data.success) {
            console.log('Comment deleted successfully');
            await updatePage();
        } else {
            console.error('Error deleting comment:', data.error);
        }
    } catch (err) {
        console.error('Error deleting comment:', err);
    }
}

function editComment(commentElement, comment) {

    const commentId = comment.commentId;

    const editingContainer = document.createElement('div');
    editingContainer.classList.add('edit-box');

    const textarea = document.createElement('textarea');
    textarea.value = commentElement.textContent;


    const updateButton = document.createElement('button');
    updateButton.textContent = 'Submit Update';


    updateButton.addEventListener('click', async () => {
        const updatedText = textarea.value.trim();

        if (updatedText !== '') {
            await updateComment(comment.threadId, comment.commentId, updatedText);
        }
    });

    editingContainer.appendChild(textarea);
    editingContainer.appendChild(updateButton);

    commentElement.innerHTML = '';
    commentElement.appendChild(editingContainer);
}

async function updateComment(threadId, commentId, updatedText) {
    try {
        const response = await fetch(`http://localhost:3000/thread/${threadId}/update-comment/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ text: updatedText }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('Comment updated successfully');
            await updatePage();
        } else {
            console.error('Error updating comment:', data.error);
        }
    } catch (err) {
        console.error('Error updating comment:', err);
    }
}
