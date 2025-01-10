import json
import random
import requests
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_url_path='', static_folder='static')

# Чтение пользователей
def read_users():
    with open('users.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# Запись пользователей
def write_users(users):
    with open('users.json', 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2)

# Получение актуальной цены ADA (с изменениями не более 10%)
def get_crypto_price():
    try:
        response = requests.get('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd')
        base_price = response.json()['cardano']['usd']
        # Генерация случайных колебаний цены в пределах 10%
        fluctuation = random.uniform(0.9, 1.1)
        return round(base_price * fluctuation, 2)
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при получении цены: {e}")
        return None

# Главная страница (index.html)
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Регистрация нового пользователя
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    users = read_users()

    if any(user['username'] == username for user in users):
        return jsonify({'success': False, 'message': 'Пользователь с таким именем уже существует'})

    new_user = {
        'username': username,
        'password': password,
        'balance': 1000,
        'cryptoBalance': 0,
        'history': []
    }

    users.append(new_user)
    write_users(users)
    return jsonify({'success': True})

# Вход пользователя
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    users = read_users()
    user = next((u for u in users if u['username'] == username and u['password'] == password), None)

    if user:
        return jsonify({'success': True, 'user': user, 'cryptoPrice': get_crypto_price()})
    else:
        return jsonify({'success': False, 'message': 'Неверные имя пользователя или пароль'})

# Покупка криптовалюты
@app.route('/buy', methods=['POST'])
def buy():
    data = request.get_json()
    username = data.get('username')
    
    users = read_users()
    user = next((u for u in users if u['username'] == username), None)

    if user:
        crypto_price = get_crypto_price()
        crypto_amount = random.randint(1, 10)

        if user['balance'] >= crypto_price * crypto_amount:
            user['balance'] -= crypto_price * crypto_amount
            user['cryptoBalance'] += crypto_amount
            user['history'].append(f"Купил {crypto_amount} криптовалюты за ${crypto_price * crypto_amount}")
            write_users(users)

            return jsonify({'success': True, 'balance': user['balance'], 'cryptoBalance': user['cryptoBalance']})

    return jsonify({'success': False, 'message': 'Недостаточно средств для покупки'})

# Продажа криптовалюты
@app.route('/sell', methods=['POST'])
def sell():
    data = request.get_json()
    username = data.get('username')
    
    users = read_users()
    user = next((u for u in users if u['username'] == username), None)

    if user:
        crypto_price = get_crypto_price()
        crypto_amount = random.randint(1, user['cryptoBalance'])

        if crypto_amount > 0:
            user['balance'] += crypto_price * crypto_amount
            user['cryptoBalance'] -= crypto_amount
            user['history'].append(f"Продал {crypto_amount} криптовалюты за ${crypto_price * crypto_amount}")
            write_users(users)

            return jsonify({'success': True, 'balance': user['balance'], 'cryptoBalance': user['cryptoBalance']})

    return jsonify({'success': False, 'message': 'Недостаточно криптовалюты для продажи'})

# Топ игроков
@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    users = read_users()
    sorted_users = sorted(users, key=lambda x: x['balance'], reverse=True)[:3]
    top_players = [{'username': u['username'], 'total': u['balance']} for u in sorted_users]
    user_rank = next((index + 1 for index, u in enumerate(sorted_users) if u['username'] == request.args.get('username')), None)

    return jsonify({'top': top_players, 'userRank': user_rank})

if __name__ == '__main__':
    app.run(debug=True)
