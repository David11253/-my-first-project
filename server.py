from flask import Flask, jsonify, request, send_from_directory
import random
import json

from flask import Flask, jsonify, request, send_from_directory
app = Flask(__name__)

if __name__ == '__main__':
    app.run()
# Чтение пользователей из файла
def read_users():
    with open('users.json', 'r') as file:
        return json.load(file)

# Запись пользователей в файл
def write_users(users):
    with open('users.json', 'w') as file:
        json.dump(users, file, indent=4)

# Роут для главной страницы
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# Роут для регистрации пользователя
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']
    
    users = read_users()
    
    if any(user['username'] == username for user in users):
        return jsonify({'success': False, 'message': 'User already exists'}), 400
    
    new_user = {
        'username': username,
        'password': password,
        'balance': 1000,
        'crypto_balance': 0,
        'history': []
    }
    
    users.append(new_user)
    write_users(users)
    return jsonify({'success': True})

# Роут для входа
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    
    users = read_users()
    user = next((user for user in users if user['username'] == username and user['password'] == password), None)
    
    if user:
        return jsonify({'success': True, 'user': user})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 400

# Роут для покупки криптовалюты
@app.route('/buy', methods=['POST'])
def buy_crypto():
    data = request.json
    username = data['username']
    
    users = read_users()
    user = next((user for user in users if user['username'] == username), None)
    
    if user:
        price = random.uniform(0.5, 2.0)  # Генерация случайной цены
        amount = random.randint(1, 10)  # Генерация случайного количества криптовалюты
        
        if user['balance'] >= price * amount:
            user['balance'] -= price * amount
            user['crypto_balance'] += amount
            user['history'].append(f"Bought {amount} crypto for ${price * amount:.2f}")
            write_users(users)
            return jsonify({'success': True, 'new_balance': user['balance'], 'crypto_balance': user['crypto_balance']})
        else:
            return jsonify({'success': False, 'message': 'Not enough balance'}), 400
    else:
        return jsonify({'success': False, 'message': 'User not found'}), 400

# Роут для продажи криптовалюты
@app.route('/sell', methods=['POST'])
def sell_crypto():
    data = request.json
    username = data['username']
    
    users = read_users()
    user = next((user for user in users if user['username'] == username), None)
    
    if user and user['crypto_balance'] > 0:
        price = random.uniform(0.5, 2.0)  # Генерация случайной цены
        amount = random.randint(1, user['crypto_balance'])  # Количество криптовалюты для продажи
        
        user['balance'] += price * amount
        user['crypto_balance'] -= amount
        user['history'].append(f"Sold {amount} crypto for ${price * amount:.2f}")
        write_users(users)
        
        return jsonify({'success': True, 'new_balance': user['balance'], 'crypto_balance': user['crypto_balance']})
    else:
        return jsonify({'success': False, 'message': 'Not enough crypto to sell'}), 400

if __name__ == '__main__':
    app.run(debug=True)
