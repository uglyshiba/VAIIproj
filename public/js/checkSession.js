const checkLoginStatus = async () => {
    try {
        const response = await fetch('http://localhost:3000/check-login', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            console.log(data.error);
            return false;
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
};

const displayUserProfile = (userData) => {
    const profileContainer = document.createElement('div');
    profileContainer.id = 'profile-container';
    profileContainer.style.backgroundColor = '#08adff';

    const profileName = document.createElement('span');
    profileName.textContent = `Welcome, ${userData.username}!`;

    const pfp = document.createElement('img');
    pfp.src = 'data:image/jpeg;base64,' + userData.profilePicture.toString('base64');

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.addEventListener('click', async () => {
        const response = await fetch('http://localhost:3000/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (response.ok) {
            window.location.reload();
            console.log('Logout successful');
        } else {
            const data = await response.json();
            console.log(data.error);
        }
    });

    profileContainer.appendChild(profileName);
    profileContainer.appendChild(pfp);
    profileContainer.appendChild(logoutButton);

    const banner = document.getElementById('banner');
    banner.parentNode.insertBefore(profileContainer, banner);
};

export { checkLoginStatus, displayUserProfile };