function isMailValid(email) {
    if(email.length === 0) {
        alert('Email field is empty');
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        alert('Wrong email format');
        return false;
    }

    return true;
}

function isPasswordValid(password) {
    if(password.length === 0) {
        alert('Password field is empty');
        return false;
    }

    if(password.length < 8) {
        alert('Password must be at least 8 characters long');
        return false;
    }

    if(!/[A-Z]/.test(password)) {
        alert('Password must contain at least one uppercase letter');
        return false;
    }

    return true;
}

export {isMailValid, isPasswordValid};