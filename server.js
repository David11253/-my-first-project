const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

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

// Главная страница (index.html) - теперь из корня проекта
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // отправка index.html из корня проекта
});

// Регистрация нового пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    // Проверяем, есть ли уже пользователь с таким ником
    if (users.some(user => user.username === username)) {
        return res.json({ success: false }); // Пользователь уже существует
    }

    // Создаем нового пользователя
    const newUser = {
        username,
        password,
        balance: 1000,
        cryptoBalance: 0,
        history: ["Иван зарегистрировался"]
    };

    // Добавляем нового пользователя в список
    users.push(newUser);
    writeUsers(users);

    res.json({ success: true }); // Успешная регистрация
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
    const { username, amount } = req.body; // amount передается от клиента
    const users = readUsers();
    const user = users.find(u => u.username === username);

    const cryptoPrice = generateCryptoPrice();

    // Проверка, хватает ли у пользователя средств
    if (user.balance >= cryptoPrice * amount) {
        user.balance -= cryptoPrice * amount;
        user.cryptoBalance += amount;
        user.history.push(`Купил ${amount} криптовалюты за $${cryptoPrice * amount}`);

        writeUsers(users);
        res.json({ success: true, newBalance: user.balance, cryptoAmount: user.cryptoBalance });
    } else {
        res.json({ success: false, message: "Недостаточно средств для покупки" });
    }
});

// Продажа криптовалюты
app.post('/sell', (req, res) => {
    const { username } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    const cryptoPrice = generateCryptoPrice();
    const cryptoAmount = Math.min(user.cryptoBalance, Math.floor(Math.random() * 10) + 1); // случайное количество криптовалюты для продажи

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
