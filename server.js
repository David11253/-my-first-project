const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Для выполнения HTTP запросов
const app = express();
const port = process.env.PORT || 3000; // Используем PORT из переменных окружения

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Чтение пользователей из файла
function readUsers() {
    const data = fs.readFileSync('users.json', 'utf8');
    return JSON.parse(data);
}

// Запись пользователей в файл
function writeUsers(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
}

// Получение текущей цены ADA с CoinGecko
async function getCryptoPrice() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');
        return response.data.cardano.usd;
    } catch (error) {
        console.error('Error fetching price:', error);
        return null; // Если не удается получить цену, возвращаем null
    }
}

// Главная страница (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // Убедитесь, что путь правильный
});

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
        history: ["Иван зарегистрировался"]
    };

    users.push(newUser);
    writeUsers(users);
    res.json({ success: true });
});

// Вход пользователя
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const cryptoPrice = await getCryptoPrice();  // Получаем актуальную цену ADA
        if (cryptoPrice !== null) {
            res.json({ success: true, user, cryptoPrice });
        } else {
            res.json({ success: false, message: "Не удалось получить цену криптовалюты" });
        }
    } else {
        res.json({ success: false });
    }
});

// Покупка криптовалюты
app.post('/buy', async (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    const cryptoPrice = await getCryptoPrice();  // Получаем актуальную цену ADA
    const cryptoAmount = Math.floor(Math.random() * 10) + 1;  // случайное количество криптовалюты

    // Проверка, хватает ли у пользователя средств
    if (user.balance >= cryptoPrice * cryptoAmount) {
        user.balance -= cryptoPrice * cryptoAmount;
        user.cryptoBalance += cryptoAmount;
        user.history.push(`Купил ${cryptoAmount} криптовалюты за $${cryptoPrice * cryptoAmount}`);

        writeUsers(users);
        res.json({ success: true, newBalance: user.balance, cryptoAmount: user.cryptoBalance });
    } else {
        res.json({ success: false, message: "Недостаточно средств для покупки" });
    }
});

// Продажа криптовалюты
app.post('/sell', async (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    const cryptoPrice = await getCryptoPrice();  // Получаем актуальную цену ADA
    const cryptoAmount = Math.min(user.cryptoBalance, Math.floor(Math.random() * 10) + 1);  // случайное количество криптовалюты для продажи

    if (cryptoAmount > 0) {
        user.balance += cryptoPrice * cryptoAmount;
        user.cryptoBalance -= cryptoAmount;
        user.history.push(`Продал ${cryptoAmount} криптовалюты за $${cryptoPrice * cryptoAmount}`);

        writeUsers(users);
        res.json({ success: true, newBalance: user.balance, cryptoAmount: user.cryptoBalance });
    } else {
        res.json({ success: false, message: "Недостаточно криптовалюты для продажи" });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
