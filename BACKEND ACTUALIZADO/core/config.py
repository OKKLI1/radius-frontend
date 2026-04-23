from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base de datos
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "radius"
    DB_PASSWORD: str = ""
    DB_NAME: str = "radius"

    # JWT
    SECRET_KEY: str = "cambia-esto"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Credenciales del panel web
    GUI_ADMIN_USER: str = "admin"
    GUI_ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"


settings = Settings()
