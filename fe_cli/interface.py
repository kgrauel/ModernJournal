import requests
import os
import json


# Load secrets file from backend.
# This is necessary because we need to know what testing users are in the database.
# Their plaintext passwords will be in the secrets file.

def get_secrets():
    with open('../backend/secrets.json') as f:
        secrets = json.load(f)
    return secrets

SECRETS = get_secrets()


# Load configuration file from current directory.
# This is necessary because we need to know what server to connect to.

def get_config():
    with open('config.json') as f:
        config = json.load(f)
    return config

CONFIG = get_config()
HOST = CONFIG['server']
if HOST[-1] != '/':
    HOST += '/'




# API calls, all sync

def authenticate(email, password):
    url = HOST + 'api/authenticate'
    data = {'email': email, 'password': password}
    r = requests.post(url, json=data)
    return r.json()


print(requests.post(HOST + 'api/ping', json={
    'token': 'f2gf2g'
}).json())


auth = requests.post(HOST + 'api/authenticate', json={
    'email': SECRETS['test_users'][0]['email'],
    'password': SECRETS['test_users'][0]['password'],
}).json()
print(auth)

print(requests.post(HOST + 'api/ping', json={
    'token': auth['token']
}).json())