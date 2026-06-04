import httpx
import json

def test_chat():
    url = "http://127.0.0.1:8000/api/chat"
    payload = {
        "message": "Thời tiết Nha Trang thế nào và lập lịch 3 ngày",
        "trip": {
            "destination": "",
            "days": 3,
            "view": "home",
            "highlightedSpot": None
        }
    }
    
    print("Sending request to FastAPI backend...")
    try:
        response = httpx.post(url, json=payload, timeout=20.0)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_chat()
