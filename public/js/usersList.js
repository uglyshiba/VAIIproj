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

        listItem.appendChild(pfp);
        listItem.appendChild(userName);
        elUsersList.appendChild(listItem);
    })
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAllUsers();
})