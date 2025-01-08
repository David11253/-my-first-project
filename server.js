const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// Глобальная переменная для хранения текущей цены криптовалюты
let cryptoPrice = generateCryptoPrice();

// Генерация новой цены криптовалюты
function generateCryptoPrice() {
    return Math.floor(Math.random() * 1000) + 1;
}

// Обновление цены каждые 10 секунд
setInterval(() => {
    cryptoPrice = generateCryptoPrice();
    console.log(`Новая цена криптовалюты: $${cryptoPrice}`);
}, 10000);

// Чтение пользователей из файла
function readUsers() {
    const data = fs.existsSync('users.json') ? fs.readFileSync('users.json', 'utf8') : '[]';
    return JSON.parse(data);
}

// Запись пользователей в файл
function writeUsers(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
}

// Главная страница (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Получить текущую цену криптовалюты
app.get('/crypto-price', (req, res) => {
    res.json({ cryptoPrice });
});

// Регистрация нового пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    if (users.some(user => user.username === username)) {
        return res.json({ success: false, message: 'Такой пользователь уже существует.' });
    }

    const newUser = {
        username,
        password,
        balance: 1000,
        cryptoBalance: 0,
        history: []
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
        res.json({ success: false, message: 'Неверные данные для входа.' });
    }
});

// Покупка криптовалюты
app.post('/buy', (req, res) => {
    const { username, amount } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.json({ success: false, message: 'Пользователь не найден.' });
    }

    const cost = cryptoPrice * amount;
    if (user.balance >= cost) {
        user.balance -= cost;
        user.cryptoBalance += amount;
        user.history.push(`Купил ${amount} криптовалюты за $${cost} (${new Date().toLocaleString()})`);

        writeUsers(users);
        res.json({ success: true, balance: user.balance, cryptoBalance: user.cryptoBalance });
    } else {
        res.json({ success: false, message: 'Недостаточно средств.' });
    }
});

// Продажа криптовалюты
app.post('/sell', (req, res) => {
    const { username, amount } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.json({ success: false, message: 'Пользователь не найден.' });
    }

    if (user.cryptoBalance >= amount) {
        const earnings = cryptoPrice * amount;
        user.balance += earnings;
        user.cryptoBalance -= amount;
        user.history.push(`Продал ${amount} криптовалюты за $${earnings} (${new Date().toLocaleString()})`);

        writeUsers(users);
        res.json({ success: true, balance: user.balance, cryptoBalance: user.cryptoBalance });
    } else {
        res.json({ success: false, message: 'Недостаточно криптовалюты.' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
