const STORAGE_KEYS = {
    USERS: 'cosmicRover_users',
    CURRENT_USER: 'cosmicRover_currentUser',
    GAME_DATA: 'cosmicRover_gameData_'
};

let users = {};
let currentUser = null;
let currentCaptcha = '';

document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadCurrentUser();
    generateCaptcha();
    updateUserStatus();
});

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
        clearErrors();
    } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('registerForm').classList.add('active');
        clearErrors();
    }
}

function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    currentCaptcha = '';
    for (let i = 0; i < 6; i++) {
        currentCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const captchaBox = document.getElementById('captchaBox');
    if (captchaBox) {
        captchaBox.innerHTML = currentCaptcha;
        captchaBox.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;
    }
}

function validateUsername(username) {
    const regex = /^[A-Za-z0-9_]{3,20}$/;
    return regex.test(username);
}

function validatePassword(password) {
    const regex = /^[A-Za-z0-9]{6,20}$/;
    return regex.test(password);
}

function clearErrors() {
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
}

function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!validateUsername(username)) {
        showLoginError('用户名格式不正确');
        return false;
    }
    
    if (!validatePassword(password)) {
        showLoginError('密码格式不正确');
        return false;
    }
    
    if (!users[username]) {
        showLoginError('用户不存在');
        return false;
    }
    
    if (users[username].password !== password) {
        showLoginError('密码错误');
        return false;
    }
    
    currentUser = {
        username: username,
        lastLogin: new Date().toISOString()
    };
    
    saveCurrentUser();
    
    const rememberMe = document.getElementById('rememberMe');
    if (rememberMe && rememberMe.checked) {
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 30);
        localStorage.setItem('cosmicRover_rememberMe', 'true');
        localStorage.setItem('cosmicRover_rememberMe_expire', expiration.toISOString());
    }
    
    window.location.href = 'game.html';
    return false;
}

function handleRegister(event) {
    event.preventDefault();
    clearErrors();
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const captchaInput = document.getElementById('captchaInput').value.trim();
    
    if (!validateUsername(username)) {
        showRegisterError('用户名格式不正确');
        return false;
    }
    
    if (!validatePassword(password)) {
        showRegisterError('密码格式不正确');
        return false;
    }
    
    if (password !== confirmPassword) {
        showRegisterError('两次输入的密码不一致');
        return false;
    }
    
    if (captchaInput.toUpperCase() !== currentCaptcha.toUpperCase()) {
        showRegisterError('验证码错误');
        generateCaptcha();
        return false;
    }
    
    if (users[username]) {
        showRegisterError('用户名已存在');
        return false;
    }
    
    users[username] = {
        password: password,
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    saveUsers();
    createUserGameData(username);
    
    currentUser = {
        username: username,
        lastLogin: new Date().toISOString()
    };
    
    saveCurrentUser();
    alert(`注册成功！欢迎 ${username}！`);
    updateUserStatus();
    
    window.location.href = 'game.html';
    return false;
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.animation = 'shake 0.5s';
        setTimeout(() => errorElement.style.animation = '', 500);
    }
}

function showRegisterError(message) {
    const errorElement = document.getElementById('registerError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.animation = 'shake 0.5s';
        setTimeout(() => errorElement.style.animation = '', 500);
    }
}

function loadUsers() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        users = data ? JSON.parse(data) : {};
    } catch (error) {
        users = {};
    }
}

function saveUsers() {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {}
}

function loadCurrentUser() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        currentUser = data ? JSON.parse(data) : null;
    } catch (error) {
        currentUser = null;
    }
}

function saveCurrentUser() {
    try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (error) {}
}

function createUserGameData(username) {
    const gameData = {
        username: username,
        created: new Date().toISOString(),
        level: 1,
        score: 0,
        crystals: 1000,
        rover: {
            health: 100,
            fuel: 100,
            upgrades: []
        }
    };
    
    try {
        localStorage.setItem(STORAGE_KEYS.GAME_DATA + username, JSON.stringify(gameData));
    } catch (error) {}
}

function updateUserStatus() {
    const statusElement = document.getElementById('userDataStatus');
    if (statusElement) {
        if (currentUser) {
            statusElement.innerHTML = `<strong>已登录用户:</strong> ${currentUser.username}`;
        } else {
            statusElement.innerHTML = `<strong>未登录</strong>`;
        }
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
