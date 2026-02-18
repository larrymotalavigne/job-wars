"""Application settings."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    PORT: int = 8000
    DB_PATH: str = "/data/gamehistory.db"
    PING_INTERVAL: int = 30       # seconds between pings
    ROOM_EXPIRY: int = 3600       # 1 hour — idle rooms cleaned up
    RECONNECT_TIMEOUT: int = 120  # 2 minutes to reconnect after disconnect
    TURN_DURATION: int = 90       # 90 seconds per turn
    MAX_ACTIONS_PER_SECOND: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
