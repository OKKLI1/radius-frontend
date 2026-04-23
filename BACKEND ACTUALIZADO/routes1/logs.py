from fastapi import APIRouter, Depends, Query
from typing import Optional
from core.database import query
from core.security import verify_token

router = APIRouter(prefix="/api/logs", tags=["Logs"], dependencies=[Depends(verify_token)])


@router.get("/auth", summary="Logs de autenticación")
@router.get("/auth/", include_in_schema=False)
def auth_logs(
    username: Optional[str] = Query(None),
    reply: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    conditions = ["1=1"]
    params = []

    if username:
        conditions.append("username LIKE %s")
        params.append(f"%{username}%")
    if reply:
        conditions.append("reply = %s")
        params.append(reply)

    where = " AND ".join(conditions)
    params += [limit, offset]

    rows = query(f"""
        SELECT
            id,
            username,
            pass        AS password_attempt,
            reply,
            authdate    AS timestamp,
            class       AS nas_info
        FROM radpostauth
        WHERE {where}
        ORDER BY authdate DESC
        LIMIT %s OFFSET %s
    """, tuple(params))

    return rows


@router.get("/auth/stats", summary="Estadísticas de autenticación")
@router.get("/auth/stats/", include_in_schema=False)
def auth_stats():
    total = query("""
        SELECT
            SUM(reply = 'Access-Accept') AS accepted,
            SUM(reply = 'Access-Reject')  AS rejected,
            COUNT(*)                      AS total
        FROM radpostauth
    """, fetchone=True)

    last_24h = query("""
        SELECT
            SUM(reply = 'Access-Accept') AS accepted,
            SUM(reply = 'Access-Reject')  AS rejected,
            COUNT(*)                      AS total
        FROM radpostauth
        WHERE authdate >= NOW() - INTERVAL 24 HOUR
    """, fetchone=True)

    top_rejected = query("""
        SELECT username, COUNT(*) AS attempts
        FROM radpostauth
        WHERE reply = 'Access-Reject'
          AND authdate >= NOW() - INTERVAL 24 HOUR
        GROUP BY username
        ORDER BY attempts DESC
        LIMIT 10
    """)

    return {
        "total_all_time": total,
        "last_24h": last_24h,
        "top_rejected_users_24h": top_rejected,
    }
