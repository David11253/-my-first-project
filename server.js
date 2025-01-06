const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

let users = {
    "testUser": {
        "password": "testPassword",
        "balance": 1000,
        "crypto": {
            "btc": 0,
            "eth": 0,
            "ada": 0
        }
    }
};

let prices = {
    "btc": 50000,
    "eth": 1500,
    "ada": 1.5
};

// Простой API для получения цен
app.get('/get_prices', (req, res) => {
    res.json(prices);
});

// API для входа
app.get('/login', (req, res) => {
    const { username, password } = req.query;
    if (users[username] && users[username].password === password) {
        res.json({
            success: true,
            ...users[username],
            username
        });
    } else {
        res.json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// API для регистрации
app.get('/register', (req, res) => {
    const { username, password } = req.query;
    if (users[username]) {
        res.json({ success: false, message: 'Пользователь уже существует' });
    } else {
        users[username] = {
            password,
            balance: 1000,
            crypto: { btc: 0, eth: 0, ada: 0 }
        };
        res.json({ success: true, message: 'Регистрация успешна' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
