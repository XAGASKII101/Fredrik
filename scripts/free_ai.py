import sys
import json
import urllib.request
import urllib.parse
import os

def query_pollinations(messages, model="openai"):
    """Free, zero-key, unlimited AI completion via Pollinations"""
    try:
        url = "https://text.pollinations.ai/"
        payload = {
            "messages": messages,
            "model": model,
            "seed": 42,
            "jsonMode": False
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8").strip()
    except Exception as e:
        return None

def query_g4f(messages, model="gpt-4o"):
    """Free AI completion via g4f (GPT4Free)"""
    try:
        import g4f
        from g4f.client import Client
        client = Client()
        response = client.chat.completions.create(
            model=model,
            messages=messages
        )
        content = response.choices[0].message.content
        if content and content.strip():
            return content.strip()
    except Exception as e:
        pass
    return None

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({"success": False, "error": "No input provided"}))
            return

        data = json.loads(raw_input)
        messages = data.get("messages", [])
        prompt = data.get("prompt", "")
        system = data.get("system", "You are Fredrik, a helpful WhatsApp AI assistant.")

        if not messages:
            messages = [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ]

        # 1. Try g4f first
        result = query_g4f(messages)

        # 2. Fallback to Pollinations AI (free, unlimited GPT-4o)
        if not result:
            result = query_pollinations(messages, model="openai")

        # 3. Fallback to Pollinations Qwen / DeepSeek
        if not result:
            result = query_pollinations(messages, model="mistral")

        if result:
            print(json.dumps({"success": True, "response": result}))
        else:
            print(json.dumps({"success": False, "error": "All free AI providers temporarily busy. Please try again."}))

    except Exception as ex:
        print(json.dumps({"success": False, "error": str(ex)}))

if __name__ == "__main__":
    main()
