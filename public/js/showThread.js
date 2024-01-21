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
    const commentContainer = document.querySelector('.comment-container');
    commentContainer.innerHTML = '';
    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        commentContainer.appendChild(commentElement);
    });
}



// Fetch comments from the server
document.addEventListener('DOMContentLoaded', async () => {
    updatePage();
});

async function submitComment() {
    const commentText = document.getElementById('commentText').value;

    if (commentText.trim() !== '') {
        // You can replace '4' with the actual thread ID
        const threadId = 4;

        try {
            const response = await fetch(`http://localhost:3000/thread/${threadId}/create-comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
    const threadId = 4; // Replace with the actual thread ID
    const page = 1;    // Define page
    const limit = 10;  // Define limit
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



export { updatePage, submitComment };