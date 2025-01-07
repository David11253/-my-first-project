const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Изначальные данные пользователей (можно хранить в отдельном JSON файле)
let users = [];

// Регистрация нового пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (users.some(user => user.username === username)) {
        return res.json({ success: false });
    }

    const newUser = {
        username,
        password,
        balance: 1000,
        history: []
    };

    users.push(newUser);
    res.json({ success: true });
});

// Вход пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true, user });
    } else {
        res.json({ success: false });
    }
});

// Покупка криптовалюты
app.post('/buy', (req, res) => {
    const price = Math.floor(Math.random() * 1000) + 1; 
    const newBalance = 1000 - price;
    res.json({ newBalance });
});

// Продажа криптовалюты
app.post('/sell', (req, res) => {
    const price = Math.floor(Math.random() * 1000) + 1; // случайная цена
    const newBalance = 1000 + price;
    res.json({ newBalance });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

