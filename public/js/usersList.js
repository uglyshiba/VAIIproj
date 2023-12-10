function fetchAllUsers() {
    fetch('/users').then(res => {
        if(res.ok) {
            return res.json();
        } else {
            throw new Error('Failed to fetch all users');
        }
    }).then(users => {
        displayAllUsers(users);
    }).catch(err => {
        console.error(err);
    })
}

function deleteUser(userId) {
    fetch(`/users/${userId}`, {
        method: 'DELETE',
    }).then(res => {
        if(res.ok) {
            fetchAllUsers();
            return res.json;
        } else {
            throw new Error('Error deleting user ' + res.json);
        }
    }).catch (err => {
        console.error(err);
    })
}

function updateUser(userId) {
    window.location.href = `/update.html?userId=${userId}`;
}
function displayAllUsers(users) {
    const sortedUsers = users.sort((a,b) => a.username.localeCompare(b.username));
    const elUsersList = document.getElementById('usersList');
    if(elUsersList) {
        elUsersList.innerHTML = "";
    }

    sortedUsers.forEach(user => {
        const listItem = document.createElement('li');
        listItem.classList.add('user');

        const pfp = document.createElement('img');
        //const blob = new Blob([user.profilePicture], { type: 'image/jpeg' });
        pfp.src = 'data:image/jpeg;base64,' + user.profilePicture.toString('base64');


        //console.log('Blob:', blob);
        //console.log('Blob URL:', URL.createObjectURL(blob));


        const userName = document.createElement('span');
        userName.textContent = user.username;
        const userEmail = document.createElement('span');
        userEmail.textContent = user.email;
        userEmail.classList.add('user-email');

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', () => deleteUser(user.id));

        // Create update button
        const updateButton = document.createElement('button');
        updateButton.classList.add('update-button');
        updateButton.addEventListener('click', () => updateUser(user.id));

        listItem.appendChild(pfp);
        listItem.appendChild(userName);
        listItem.appendChild(userEmail);
        listItem.appendChild(deleteButton);
        listItem.appendChild(updateButton);
        elUsersList.appendChild(listItem);
    })
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers();
})