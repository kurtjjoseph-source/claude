from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Agent Cloud API"
    app_env: str = "development"
    api_base_url: str = "http://localhost:8001"
    database_url: str = "sqlite:///./agent.db"
    jwt_secret: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5"
    enable_scheduler: bool = True
    cycle_interval_hours: int = 24
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
