import urllib.request
import urllib.parse
import json

base_url = "http://localhost:8000"

def test_flow():
    print("Testing APIs...")
    # 1. Server is up
    req = urllib.request.Request(f"{base_url}/")
    try:
        urllib.request.urlopen(req)
        print("1. Server is up and serving frontend.")
    except Exception as e:
        print("Server not running:", e)
        return

    # 2. Login
    try:
        data = urllib.parse.urlencode({"username": "admin", "password": "admin123"}).encode()
        req = urllib.request.Request(f"{base_url}/api/admin/login", data=data)
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read())
            token = res["access_token"]
            print("2. Neon DB connection and Admin Login work. Tables are accessible.")
    except Exception as e:
        print("Admin login failed:", e)
        if hasattr(e, 'read'):
            print(e.read())
        return

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # 3. Create product
    try:
        product_data = {
            "name": "Test Product",
            "price": 10.99,
            "description": "Test Desc",
            "category": "Test Cat",
            "image_data": []
        }
        req = urllib.request.Request(f"{base_url}/api/products", data=json.dumps(product_data).encode(), headers=headers, method="POST")
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read())
            prod_id = res["id"]
            print("3. Product API (Create) works.")
            
        req = urllib.request.Request(f"{base_url}/api/products", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read())
            if len(res) > 0:
                print("4. Product API (Read) works.")
                
        req = urllib.request.Request(f"{base_url}/api/products/{prod_id}", headers={"Authorization": f"Bearer {token}"}, method="DELETE")
        urllib.request.urlopen(req)
    except Exception as e:
        print("Products API failed:", e)

    # 4. Create Order
    try:
        order_data = {
            "customer_name": "Test Customer",
            "customer_email": "test@test.com",
            "customer_phone": "1234567890",
            "customer_address": "123 Test St",
            "amount": 10.99,
            "items": json.dumps([{"product_id": 1, "qty": 1, "price": 10.99}])
        }
        req = urllib.request.Request(f"{base_url}/api/orders", data=json.dumps(order_data).encode(), headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read())
            print("5. Orders API works.")
    except Exception as e:
        print("Orders API failed:", e)

if __name__ == "__main__":
    test_flow()
