const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = path.join(__dirname, 'users.json');
const EVENTS_FILE = path.join(__dirname, 'events.json');

// Ensure files exist
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}));
if (!fs.existsSync(EVENTS_FILE)) fs.writeFileSync(EVENTS_FILE, JSON.stringify([]));

const readData = (file) => JSON.parse(fs.readFileSync(file));
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data));

// API
app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    const users = readData(DATA_FILE);

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Введите имя и пароль.' });
    }

    if (users[username]) {
        if (users[username].password === password) {
            return res.json({ success: true, balance: users[username].balance });
        } else {
            return res.status(401).json({ success: false, message: 'Неверный пароль.' });
        }
    } else {
        if (Object.keys(users).includes(username)) {
            return res.status(400).json({ success: false, message: 'Имя пользователя уже занято.' });
        }
        users[username] = { password, balance: 1000 };
        writeData(DATA_FILE, users);
        return res.json({ success: true, balance: 1000 });
    }
});

app.get('/price', (req, res) => {
    const price = Math.floor(Math.random() * 1000) + 1; // Random price between 1 and 1000
    res.json({ price });
});

app.post('/trade', (req, res) => {
    const { username, type, amount, price } = req.body;
    const users = readData(DATA_FILE);
    const events = readData(EVENTS_FILE);

    if (!users[username]) {
        return res.status(404).json({ success: false, message: 'Пользователь не найден.' });
    }

    if (type === 'buy') {
        const cost = amount * price;
        if (users[username].balance >= cost) {
            users[username].balance -= cost;
            events.push(`${username} купил ${amount} криптовалюты.`);
        } else {
            return res.status(400).json({ success: false, message: 'Недостаточно средств.' });
        }
    } else if (type === 'sell') {
        const revenue = amount * price;
        users[username].balance += revenue;
        events.push(`${username} продал ${amount} криптовалюты.`);
    }

    writeData(DATA_FILE, users);
    if (events.length > 7) events.shift();
    writeData(EVENTS_FILE, events);

    res.json({ success: true, balance: users[username].balance });
});

app.get('/events', (req, res) => {
    const events = readData(EVENTS_FILE);
    res.json(events);
});

app.get('/top', (req, res) => {
    const users = readData(DATA_FILE);
    const sorted = Object.entries(users)
        .sort(([, a], [, b]) => b.balance - a.balance)
        .slice(0, 5)
        .map(([username, { balance }]) => ({ username, balance }));

    res.json(sorted);
});

// Запуск сервера
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
