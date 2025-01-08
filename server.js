const express = require('express');
const axios = require('axios'); // Для работы с API
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

// Путь к файлу пользователей
const USERS_FILE = './users.json';

// Функция чтения пользователей
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// Функция записи пользователей
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Получение цены ADA из CoinGecko
async function fetchAdaPrice() {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd'
        );
        return response.data.cardano.usd; // Цена ADA в долларах
    } catch (error) {
        console.error('Ошибка получения цены ADA:', error);
        return 1; // Если ошибка, вернём дефолтное значение
    }
}

// Эндпоинт для получения текущей цены ADA
app.get('/crypto-price', async (req, res) => {
    const adaPrice = await fetchAdaPrice();
    res.json({ cryptoPrice: adaPrice });
});

// Регистрация пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    if (users.some(user => user.username === username)) {
        return res.json({ success: false, message: 'Пользователь с таким именем уже существует' });
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
    res.json({ success: true, message: 'Регистрация успешна' });
});

// Логин пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, user });
    } else {
        res.json({ success: false, message: 'Неверное имя пользователя или пароль' });
    }
});

// Покупка криптовалюты
app.post('/buy', async (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) return res.json({ success: false, message: 'Пользователь не найден' });

    const adaPrice = await fetchAdaPrice();
    if (user.balance >= adaPrice) {
        user.balance -= adaPrice;
        user.cryptoBalance += 1; // Покупаем 1 единицу ADA
        user.history.push(`Купил 1 ADA за $${adaPrice}`);
        writeUsers(users);
        res.json({ success: true, balance: user.balance, cryptoBalance: user.cryptoBalance });
    } else {
        res.json({ success: false, message: 'Недостаточно средств для покупки' });
    }
});

// Продажа криптовалюты
app.post('/sell', async (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    if (!user) return res.json({ success: false, message: 'Пользователь не найден' });

    if (user.cryptoBalance > 0) {
        const adaPrice = await fetchAdaPrice();
        user.balance += adaPrice;
        user.cryptoBalance -= 1; // Продаём 1 единицу ADA
        user.history.push(`Продал 1 ADA за $${adaPrice}`);
        writeUsers(users);
        res.json({ success: true, balance: user.balance, cryptoBalance: user.cryptoBalance });
    } else {
        res.json({ success: false, message: 'Недостаточно криптовалюты для продажи' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
