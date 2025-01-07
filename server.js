
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Учитываем PORT из окружения (Render)

const DATA_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Создаём файл, если его нет
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function readUserData() {
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeUserData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

// API Endpoints
app.post('/auth', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const users = readUserData();

    if (users[username]) {
        if (users[username].password === password) {
            return res.json({ success: true, balance: users[username].balance });
        } else {
            return res.status(401).json({ success: false, message: 'Incorrect password.' });
        }
    } else {
        users[username] = { password, balance: 1000 };
        writeUserData(users);
        return res.json({ success: true, balance: 1000 });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
