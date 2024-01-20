document.addEventListener('DOMContentLoaded', () => {
    const createThreadButton = document.getElementById('create-thread-button');

    createThreadButton.addEventListener('click', async () => {
        const threadNameInput = document.getElementById('thread-name-input');
        const threadTextInput = document.getElementById('thread-text-input');

        const threadName = threadNameInput.value;
        const threadText = threadTextInput.value;

        try {
            const response = await fetch('http://localhost:3000/create-thread', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    threadName,
                    threadText,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log(data.success); // Success message
                // Redirect to the thread or perform any other necessary action
            } else {
                console.error(data.error); // Error message
                // Handle the error appropriately (e.g., display an error message to the user)
            }
        } catch (error) {
            console.error('Failed to create thread:', error);
        }
    });
});