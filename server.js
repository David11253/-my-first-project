const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Чтение пользователей из файла
function readUsers() {
    const data = fs.readFileSync('users.json', 'utf8');
    return JSON.parse(data);
}

// Запись пользователей в файл
function writeUsers(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
}

// Генерация цены криптовалюты
function generateCryptoPrice() {
    return Math.floor(Math.random() * 1000) + 1;
}

// Регистрация нового пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    if (users.some(user => user.username === username)) {
        return res.json({ success: false });
    }

    const newUser = {
        username,
        password,
        balance: 1000,
        cryptoBalance: 0,
        history: [],
    };

    users.push(newUser);
    writeUsers(users);
    res.json({ success: true });
});

// Вход пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const cryptoPrice = generateCryptoPrice();
        res.json({ success: true, user, cryptoPrice });
    } else {
        res.json({ success: false });
    }
});

// Покупка криптовалюты
app.post('/buy', (req, res) => {
    const cryptoPrice = generateCryptoPrice();
    const cryptoAmount = Math.floor(Math.random() * 10) + 1; // количество криптовалюты
    const newBalance = 1000 - cryptoPrice * cryptoAmount;

    res.json({ newBalance, cryptoAmount });
});

// Продажа криптовалюты
app.post('/sell', (req, res) => {
    const cryptoPrice = generateCryptoPrice();
    const cryptoAmount = Math.floor(Math.random() * 10) + 1; // количество криптовалюты
    const newBalance = 1000 + cryptoPrice * cryptoAmount;

    res.json({ newBalance, cryptoAmount });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
