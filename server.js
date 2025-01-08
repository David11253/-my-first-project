const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

let cryptoPrice = generateCryptoPrice(); // Начальная цена криптовалюты

app.use(express.json());

// Чтение пользователей из файла
function readUsers() {
    if (!fs.existsSync('users.json')) return [];
    const data = fs.readFileSync('users.json', 'utf8');
    return JSON.parse(data);
}

// Запись пользователей в файл
function writeUsers(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
}

// Генерация цены криптовалюты
function generateCryptoPrice() {
    return Math.floor(Math.random() * 100) + 1; // Случайное число от 1 до 100
}

// Обновление цены каждые 10 секунд
setInterval(() => {
    cryptoPrice = generateCryptoPrice();
    console.log(`Новая цена криптовалюты: $${cryptoPrice}`);
}, 10000);

// Регистрация нового пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    if (users.some(user => user.username === username)) {
        return res.json({ success: false, message: 'Имя пользователя уже занято.' });
    }

    const newUser = {
        username,
        password,
        balance: 1000,
        cryptoBalance: 0,
        totalBalance: 1000, // Сумма денег и стоимости криптовалюты
        history: ['Регистрация в игре.']
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
        res.json({ success: true, user, cryptoPrice });
    } else {
        res.json({ success: false, message: 'Неверное имя пользователя или пароль.' });
    }
});

// Покупка криптовалюты
app.post('/buy', (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) return res.json({ success: false, message: 'Пользователь не найден.' });

    const cryptoAmount = 1; // Покупка по одной единице
    const cost = cryptoPrice * cryptoAmount;

    if (user.balance >= cost) {
        user.balance -= cost;
        user.cryptoBalance += cryptoAmount;
        user.totalBalance = user.balance + user.cryptoBalance * cryptoPrice;
        user.history.push(`Купил ${cryptoAmount} ADA за $${cost}.`);
        writeUsers(users);

        res.json({
            success: true,
            balance: user.balance,
            cryptoBalance: user.cryptoBalance
        });
    } else {
        res.json({ success: false, message: 'Недостаточно средств для покупки.' });
    }
});

// Продажа криптовалюты
app.post('/sell', (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) return res.json({ success: false, message: 'Пользователь не найден.' });

    const cryptoAmount = 1; // Продажа по одной единице
    if (user.cryptoBalance >= cryptoAmount) {
        const income = cryptoPrice * cryptoAmount;
        user.balance += income;
        user.cryptoBalance -= cryptoAmount;
        user.totalBalance = user.balance + user.cryptoBalance * cryptoPrice;
        user.history.push(`Продал ${cryptoAmount} ADA за $${income}.`);
        writeUsers(users);

        res.json({
            success: true,
            balance: user.balance,
            cryptoBalance: user.cryptoBalance
        });
    } else {
        res.json({ success: false, message: 'Недостаточно криптовалюты для продажи.' });
    }
});

// Лидерборд
app.get('/leaderboard', (req, res) => {
    const { username } = req.query;
    const users = readUsers();

    // Сортировка игроков по общему балансу (убывание)
    const sortedUsers = [...users].sort((a, b) => b.totalBalance - a.totalBalance);

    const top = sortedUsers.slice(0, 3).map(user => ({
        username: user.username,
        total: user.totalBalance
    }));

    const userRank = sortedUsers.findIndex(user => user.username === username) + 1;

    res.json({ top, userRank });
});

// Получение текущей цены криптовалюты
app.get('/crypto-price', (req, res) => {
    res.json({ cryptoPrice });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
