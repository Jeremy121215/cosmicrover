// 本地存储键名
const STORAGE_KEYS = {
    USERS: 'cosmicRover_users',
    CURRENT_USER: 'cosmicRover_currentUser',
    GAME_DATA: 'cosmicRover_gameData_'
};

// 初始化
let users = {};
let currentUser = null;
let currentCaptcha = '';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载存储的用户数据
    loadUsers();
    loadCurrentUser();
    
    // 生成人机验证码
    generateCaptcha();
    
    // 显示当前用户状态
    updateUserStatus();
});

// 切换登录/注册标签
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('active');
    });
    
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

// 生成人机验证码
function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    currentCaptcha = '';
    for (let i = 0; i < 6; i++) {
        currentCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const captchaBox = document.getElementById('captchaBox');
    if (captchaBox) {
        captchaBox.innerHTML = currentCaptcha;
        
        // 添加扭曲效果
        captchaBox.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;
        captchaBox.style.textShadow = `${Math.random() * 3}px ${Math.random() * 3}px ${Math.random() * 3}px rgba(0,0,0,0.3)`;
    }
}

// 验证用户名格式（仅英文、数字、下划线）
function validateUsername(username) {
    const regex = /^[A-Za-z0-9_]{3,20}$/;
    return regex.test(username);
}

// 验证密码格式（仅英文、数字）
function validatePassword(password) {
    const regex = /^[A-Za-z0-9]{6,20}$/;
    return regex.test(password);
}

// 清除错误信息
function clearErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('registerError').textContent = '';
}

// 处理登录
function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // 验证用户名格式
    if (!validateUsername(username)) {
        showLoginError('用户名格式不正确（仅限英文、数字、下划线，3-20位）');
        return false;
    }
    
    // 验证密码格式
    if (!validatePassword(password)) {
        showLoginError('密码格式不正确（仅限英文和数字，6-20位）');
        return false;
    }
    
    // 检查用户是否存在
    if (!users[username]) {
        showLoginError('用户不存在');
        return false;
    }
    
    // 验证密码
    if (users[username].password !== password) {
        showLoginError('密码错误');
        return false;
    }
    
    // 登录成功
    currentUser = {
        username: username,
        lastLogin: new Date().toISOString()
    };
    
    // 保存当前用户
    saveCurrentUser();
    
    // 如果勾选了记住我，保存登录状态30天
    if (rememberMe) {
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 30);
        localStorage.setItem('cosmicRover_rememberMe', 'true');
        localStorage.setItem('cosmicRover_rememberMe_expire', expiration.toISOString());
    }
    
    // 跳转到游戏页面（预留）
    alert(`欢迎回来，${username}！即将进入游戏...`);
    updateUserStatus();
    
    // 这里可以跳转到游戏主页面
    // window.location.href = 'game.html';
    
    return false; // 防止表单提交
}

// 处理注册
function handleRegister(event) {
    event.preventDefault();
    clearErrors();
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const captchaInput = document.getElementById('captchaInput').value.trim();
    
    // 验证用户名格式
    if (!validateUsername(username)) {
        showRegisterError('用户名格式不正确（仅限英文、数字、下划线，3-20位）');
        return false;
    }
    
    // 验证密码格式
    if (!validatePassword(password)) {
        showRegisterError('密码格式不正确（仅限英文和数字，6-20位）');
        return false;
    }
    
    // 验证确认密码
    if (password !== confirmPassword) {
        showRegisterError('两次输入的密码不一致');
        return false;
    }
    
    // 验证人机验证码
    if (captchaInput.toUpperCase() !== currentCaptcha.toUpperCase()) {
        showRegisterError('验证码错误，请重新输入');
        generateCaptcha();
        return false;
    }
    
    // 检查用户名是否已存在
    if (users[username]) {
        showRegisterError('用户名已存在');
        return false;
    }
    
    // 创建新用户
    users[username] = {
        password: password,
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    // 保存用户数据
    saveUsers();
    
    // 创建用户游戏数据（预留）
    createUserGameData(username);
    
    // 自动登录
    currentUser = {
        username: username,
        lastLogin: new Date().toISOString()
    };
    saveCurrentUser();
    
    // 显示成功消息
    alert(`注册成功！欢迎 ${username}！`);
    updateUserStatus();
    
    // 切换到登录标签
    switchTab('login');
    
    // 清空注册表单
    document.getElementById('registerFormElement').reset();
    generateCaptcha();
    
    return false; // 防止表单提交
}

// 显示登录错误
function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = message;
    errorElement.style.animation = 'shake 0.5s';
    setTimeout(() => {
        errorElement.style.animation = '';
    }, 500);
}

// 显示注册错误
function showRegisterError(message) {
    const errorElement = document.getElementById('registerError');
    errorElement.textContent = message;
    errorElement.style.animation = 'shake 0.5s';
    setTimeout(() => {
        errorElement.style.animation = '';
    }, 500);
}

// 加载用户数据
function loadUsers() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        users = data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('加载用户数据失败:', error);
        users = {};
    }
}

// 保存用户数据
function saveUsers() {
    try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
        console.error('保存用户数据失败:', error);
    }
}

// 加载当前用户
function loadCurrentUser() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        currentUser = data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('加载当前用户失败:', error);
        currentUser = null;
    }
}

// 保存当前用户
function saveCurrentUser() {
    try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } catch (error) {
        console.error('保存当前用户失败:', error);
    }
}

// 创建用户游戏数据（预留）
function createUserGameData(username) {
    const gameData = {
        username: username,
        created: new Date().toISOString(),
        level: 1,
        score: 0,
        resources: {
            energy: 100,
            minerals: 0,
            research: 0
        },
        rover: {
            level: 1,
            health: 100,
            energy: 100
        },
        achievements: [],
        settings: {
            sound: true,
            music: true,
            difficulty: 'normal'
        }
    };
    
    try {
        localStorage.setItem(
            STORAGE_KEYS.GAME_DATA + username,
            JSON.stringify(gameData)
        );
    } catch (error) {
        console.error('创建游戏数据失败:', error);
    }
}

// 更新用户状态显示
function updateUserStatus() {
    const statusElement = document.getElementById('userDataStatus');
    if (statusElement) {
        if (currentUser) {
            statusElement.innerHTML = `
                <strong>已登录用户:</strong> ${currentUser.username}<br>
                <small>游戏数据已就绪</small>
            `;
            statusElement.style.color = '#4fc3f7';
        } else {
            statusElement.innerHTML = `
                <strong>未登录</strong><br>
                <small>请登录或注册开始游戏</small>
            `;
            statusElement.style.color = '#aaa';
        }
    }
}

// 添加抖动动画到CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
