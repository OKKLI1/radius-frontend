import mysql.connector
from mysql.connector import pooling
from core.config import settings

# Pool de conexiones para mejor rendimiento
connection_pool = pooling.MySQLConnectionPool(
    pool_name="radius_pool",
    pool_size=5,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    user=settings.DB_USER,
    password=settings.DB_PASSWORD,
    database=settings.DB_NAME,
    charset="utf8mb4",
    collation="utf8mb4_general_ci",
)


def get_connection():
    """Obtiene una conexión del pool."""
    return connection_pool.get_connection()


def query(sql: str, params: tuple = (), fetchone: bool = False):
    """Ejecuta un SELECT y retorna los resultados como lista de dicts."""
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params)
        if fetchone:
            return cur.fetchone()
        return cur.fetchall()
    finally:
        conn.close()


def execute(sql: str, params: tuple = ()):
    """Ejecuta INSERT / UPDATE / DELETE y retorna el lastrowid."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def execute_many(statements: list[tuple]):
    """Ejecuta múltiples statements en una sola transacción.
    statements: [(sql, params), ...]
    """
    conn = get_connection()
    try:
        cur = conn.cursor()
        for sql, params in statements:
            cur.execute(sql, params)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
