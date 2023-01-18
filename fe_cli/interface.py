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

def request(path, data):
    url = HOST + path
    try:
        r = requests.post(url, json=data)
        return r.json()
    except:
        return {'success': False, 'message': 'Could not communicate with endpoint.'}

def authenticate(email, password):
    return request('api/authenticate', {'email': email, 'password': password})

def ping(token):
    return request('api/ping', {'token': token})

def logout(token, invalidate_all=False):
    return request('api/logout', {'token': token, 'invalidate_all': invalidate_all})
