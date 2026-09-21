import os
import requests
from typing import Dict, Any, Optional

OFFICIAL_TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone"

def get_typesafe_api_key() -> str:
    key = os.getenv("TYPESAFE_API_KEY")
    if key and key.strip():
        return key.strip()
    
    # Check ~/.env
    home_env = os.path.expanduser("~/.env")
    if os.path.exists(home_env):
        try:
            with open(home_env, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("TYPESAFE_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass

    # Check ~/.hermes/.env
    hermes_env = os.path.expanduser("~/.hermes/.env")
    if os.path.exists(hermes_env):
        try:
            with open(hermes_env, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("TYPESAFE_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass

    return ""

class JevEngine:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or get_typesafe_api_key()
        if not self.api_key:
            raise ValueError("TYPESAFE_API_KEY not found in environment, ~/.env, or ~/.hermes/.env")

    def decide(self, state: str, questions: Dict[str, Any], model: str = "jev-latest") -> Dict[str, Any]:
        """
        Queries TypeSafe's System 1 non-autoregressive decision model.
        Returns the parsed answers dictionary and usage metadata.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "state": state,
            "questions": questions
        }
        resp = requests.post(OFFICIAL_TYPESAFE_URL, headers=headers, json=payload, timeout=12)
        if resp.status_code != 200:
            raise RuntimeError(f"TypeSafe API error {resp.status_code}: {resp.text}")
        return resp.json()
