# Test file for Solon AI review validation
import os
import sqlite3

# SECURITY: Hardcoded API key
API_KEY = "sk-test-abc123xyz456"

# SECURITY: SQL injection vulnerability  
def get_user(user_id):
    conn = sqlite3.connect("quide.db")
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    return cursor.fetchone()

# BUG: No error handling on async operation
def fetch_data(url):
    import urllib.request
    response = urllib.request.urlopen(url)
    return response.read()

# BUG: Mutable default argument
def add_plugin(name, plugins=[]):
    plugins.append(name)
    return plugins

# BUG: Division by zero not handled
def calculate_average(numbers):
    total = sum(numbers)
    return total / len(numbers)

# SECURITY: Command injection
def run_query(user_input):
    os.system(f"grep {user_input} /var/log/quide.log")

class PluginManager:
    def __init__(self):
        self.plugins = {}
    
    # BUG: No validation, no error handling
    def load_plugin(self, path):
        with open(path) as f:
            exec(f.read())  # SECURITY: arbitrary code execution
    
    # BUG: Returns None silently if not found
    def get_plugin(self, name):
        for key in self.plugins:
            if key == name:
                return self.plugins[key]
