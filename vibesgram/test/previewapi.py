import requests

# API地址，根据实际情况修改
# url = "http://localhost:3000/api/v1/preview/create"
url = "http://www.binbody.com/api/v1/preview/create"
# 构造请求体
payload = {
    "html": "<h1>v1 hello prod</h1>"
}

# 发送POST请求
response = requests.post(url, json=payload)

# 输出响应内容
print("Status:", response.status_code)
print("Response:", response.json())
