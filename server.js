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
    res.sendFile(path.join(__dirname, 'index.html')); // отправка index.html из корня проекта
});

// Получить текущую цену криптовалюты
app.get('/crypto-price', (req, res) => {
    res.json({ cryptoPrice }); // Отправляем текущую цену криптовалюты
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
        history: []
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
        res.json({ success: true, user, cryptoPrice }); // Отправляем актуальную цену при входе
    } else {
        res.json({ success: false });
    }
});

// Покупка криптовалюты
app.post('/buy', (req, res) => {
    const { username, amount } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    // Проверка, хватает ли у пользователя средств
    if (user.balance >= cryptoPrice * amount) {
        user.balance -= cryptoPrice * amount;
        user.cryptoBalance += amount;
        user.history.push(`Купил ${amount} криптовалюты за $${cryptoPrice * amount} [${new Date().toLocaleString()}]`);

        writeUsers(users);
        res.json({ success: true, newBalance: user.balance, cryptoAmount: user.cryptoBalance });
    } else {
        res.json({ success: false, message: "Недостаточно средств для покупки" });
    }
});

// Продажа криптовалюты
app.post('/sell', (req, res) => {
    const { username, amount } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username);

    // Проверка, хватает ли у пользователя криптовалюты
    if (user.cryptoBalance >= amount) {
        user.balance += cryptoPrice * amount;
        user.cryptoBalance -= amount;
        user.history.push(`Продал ${amount} криптовалюты за $${cryptoPrice * amount} [${new Date().toLocaleString()}]`);

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
