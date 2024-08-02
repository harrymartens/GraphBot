import requests

url = 'http://127.0.0.1:5000/process'
input = input("Enter query: ")
payload = {
    'text': input
}
response = requests.post(url, json=payload)
print(response.json())