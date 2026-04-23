from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from core.database import query, execute
from core.security import verify_token

router = APIRouter(
    prefix="/api/accounting",
    tags=["Accounting"],
    dependencies=[Depends(verify_token)],
)


def _ensure_hotspot_table():
    execute(
        """
        CREATE TABLE IF NOT EXISTS axio_hotspots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            nas_id INT NULL,
            location VARCHAR(150) NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


@router.get("/general", summary="General accounting records")
@router.get("/general/", include_in_schema=False)
def accounting_general(
    ip_address: Optional[str] = Query(None),
    nas_ip: Optional[str] = Query(None),
    active_only: bool = Query(False),
    limit: int = Query(200, ge=1, le=2000),
):
    conditions = ["1=1"]
    params = []

    if ip_address:
        conditions.append("r.framedipaddress LIKE %s")
        params.append(f"%{ip_address}%")
    if nas_ip:
        conditions.append("r.nasipaddress LIKE %s")
        params.append(f"%{nas_ip}%")
    if active_only:
        conditions.append("r.acctstoptime IS NULL")

    where_sql = " AND ".join(conditions)
    params.append(limit)

    return query(
        f"""
        SELECT
            r.radacctid,
            r.username,
            r.nasipaddress,
            n.shortname AS nas_name,
            r.framedipaddress,
            r.acctstarttime,
            r.acctstoptime,
            r.acctsessiontime,
            (COALESCE(r.acctinputoctets,0) + COALESCE(r.acctoutputoctets,0)) AS total_bytes
        FROM radacct r
        LEFT JOIN nas n ON n.nasname = r.nasipaddress
        WHERE {where_sql}
        ORDER BY r.radacctid DESC
        LIMIT %s
        """,
        tuple(params),
    )


@router.get("/plans/usage", summary="Plan accounting usage")
@router.get("/plans/usage/", include_in_schema=False)
def plans_usage(
    username: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    plan_name: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=2000),
):
    conditions = ["1=1"]
    params = []

    if username:
        conditions.append("r.username LIKE %s")
        params.append(f"%{username}%")
    if plan_name:
        conditions.append("rug.groupname = %s")
        params.append(plan_name)
    if start_date:
        conditions.append("DATE(r.acctstarttime) >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("DATE(r.acctstarttime) <= %s")
        params.append(end_date)

    where_sql = " AND ".join(conditions)
    params.append(limit)

    return query(
        f"""
        SELECT
            r.username,
            COALESCE(rug.groupname, 'sin-plan') AS plan_name,
            COUNT(*) AS sessions,
            SUM(COALESCE(r.acctsessiontime,0)) AS total_seconds,
            SUM(COALESCE(r.acctinputoctets,0) + COALESCE(r.acctoutputoctets,0)) AS total_bytes
        FROM radacct r
        LEFT JOIN radusergroup rug ON rug.username = r.username
        WHERE {where_sql}
        GROUP BY r.username, rug.groupname
        ORDER BY total_bytes DESC
        LIMIT %s
        """,
        tuple(params),
    )


ALLOWED_FIELDS = {
    "radacctid": "r.radacctid",
    "acctsessionid": "r.acctsessionid",
    "acctuniqueid": "r.acctuniqueid",
    "username": "r.username",
    "realm": "r.realm",
    "nasipaddress": "r.nasipaddress",
    "nasportid": "r.nasportid",
    "nasporttype": "r.nasporttype",
    "acctstarttime": "r.acctstarttime",
    "acctstoptime": "r.acctstoptime",
    "acctsessiontime": "r.acctsessiontime",
    "acctinputoctets": "r.acctinputoctets",
    "acctoutputoctets": "r.acctoutputoctets",
    "callingstationid": "r.callingstationid",
    "framedipaddress": "r.framedipaddress",
}

OP_MAP = {
    "equals": "=",
    "contains": "LIKE",
    "starts_with": "LIKE",
    "ends_with": "LIKE",
    "gt": ">",
    "gte": ">=",
    "lt": "<",
    "lte": "<=",
}


@router.get("/custom/fields", summary="Available custom query fields")
@router.get("/custom/fields/", include_in_schema=False)
def custom_fields():
    return {
        "fields": sorted(ALLOWED_FIELDS.keys()),
        "operators": sorted(OP_MAP.keys()),
    }


class CustomQueryRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    where_field: str = "radacctid"
    operator: str = "equals"
    filter_value: Optional[str] = None
    select_fields: List[str] = ["radacctid", "username", "nasipaddress", "acctstarttime"]
    order_by: str = "radacctid"
    order_type: str = "desc"
    limit: int = 200


@router.post("/custom/query", summary="Execute safe custom accounting query")
@router.post("/custom/query/", include_in_schema=False)
def custom_query(payload: CustomQueryRequest):
    if payload.where_field not in ALLOWED_FIELDS:
        raise HTTPException(status_code=400, detail="Invalid where_field")
    if payload.order_by not in ALLOWED_FIELDS:
        raise HTTPException(status_code=400, detail="Invalid order_by")
    if payload.operator not in OP_MAP:
        raise HTTPException(status_code=400, detail="Invalid operator")
    if payload.limit < 1 or payload.limit > 2000:
        raise HTTPException(status_code=400, detail="Invalid limit")

    clean_fields = [f for f in payload.select_fields if f in ALLOWED_FIELDS]
    if not clean_fields:
        clean_fields = ["radacctid", "username", "nasipaddress", "acctstarttime"]

    select_sql = ", ".join(f"{ALLOWED_FIELDS[f]} AS {f}" for f in clean_fields)
    conditions = ["1=1"]
    params = []

    if payload.start_date:
        conditions.append("DATE(r.acctstarttime) >= %s")
        params.append(payload.start_date)
    if payload.end_date:
        conditions.append("DATE(r.acctstarttime) <= %s")
        params.append(payload.end_date)

    if payload.filter_value:
        sql_op = OP_MAP[payload.operator]
        field_sql = ALLOWED_FIELDS[payload.where_field]
        value = payload.filter_value
        if payload.operator == "contains":
            value = f"%{value}%"
        elif payload.operator == "starts_with":
            value = f"{value}%"
        elif payload.operator == "ends_with":
            value = f"%{value}"
        conditions.append(f"{field_sql} {sql_op} %s")
        params.append(value)

    where_sql = " AND ".join(conditions)
    order_type = "ASC" if str(payload.order_type).lower() == "asc" else "DESC"
    params.append(payload.limit)

    rows = query(
        f"""
        SELECT {select_sql}
        FROM radacct r
        WHERE {where_sql}
        ORDER BY {ALLOWED_FIELDS[payload.order_by]} {order_type}
        LIMIT %s
        """,
        tuple(params),
    )
    return {"rows": rows, "count": len(rows)}


@router.get("/hotspots/list", summary="List hotspots for accounting")
@router.get("/hotspots/list/", include_in_schema=False)
def hotspots_list():
    _ensure_hotspot_table()
    return query(
        """
        SELECT h.id, h.name, h.status, n.nasname, n.shortname
        FROM axio_hotspots h
        LEFT JOIN nas n ON n.id = h.nas_id
        ORDER BY h.name
        """
    )


@router.get("/hotspots/usage", summary="Hotspot accounting usage")
@router.get("/hotspots/usage/", include_in_schema=False)
def hotspots_usage(
    hotspots: Optional[str] = Query(None, description="comma-separated hotspot ids"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    _ensure_hotspot_table()
    conditions = ["1=1"]
    params = []

    if start_date:
        conditions.append("DATE(r.acctstarttime) >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("DATE(r.acctstarttime) <= %s")
        params.append(end_date)

    hotspot_ids = []
    if hotspots:
        hotspot_ids = [int(x) for x in hotspots.split(",") if x.strip().isdigit()]
    if hotspot_ids:
        placeholders = ",".join(["%s"] * len(hotspot_ids))
        conditions.append(f"h.id IN ({placeholders})")
        params.extend(hotspot_ids)

    where_sql = " AND ".join(conditions)
    return query(
        f"""
        SELECT
            COALESCE(h.name, COALESCE(n.shortname, r.nasipaddress)) AS hotspot_name,
            r.nasipaddress,
            COUNT(*) AS sessions,
            SUM(COALESCE(r.acctsessiontime,0)) AS total_seconds,
            SUM(COALESCE(r.acctinputoctets,0) + COALESCE(r.acctoutputoctets,0)) AS total_bytes
        FROM radacct r
        LEFT JOIN nas n ON n.nasname = r.nasipaddress
        LEFT JOIN axio_hotspots h ON h.nas_id = n.id
        WHERE {where_sql}
        GROUP BY hotspot_name, r.nasipaddress
        ORDER BY total_bytes DESC
        """,
        tuple(params),
    )


class CleanupRequest(BaseModel):
    older_than_hours: int = 24


@router.post("/maintenance/cleanup-stale", summary="Close stale active sessions")
@router.post("/maintenance/cleanup-stale/", include_in_schema=False)
def cleanup_stale_sessions(payload: CleanupRequest):
    if payload.older_than_hours < 1 or payload.older_than_hours > 24 * 90:
        raise HTTPException(status_code=400, detail="older_than_hours out of range")

    target = query(
        """
        SELECT COUNT(*) AS total
        FROM radacct
        WHERE acctstoptime IS NULL
          AND TIMESTAMPDIFF(HOUR, acctstarttime, NOW()) > %s
        """,
        (payload.older_than_hours,),
        fetchone=True,
    )

    execute(
        """
        UPDATE radacct
        SET acctstoptime = NOW(),
            acctterminatecause = 'Stale-Session-Cleanup'
        WHERE acctstoptime IS NULL
          AND TIMESTAMPDIFF(HOUR, acctstarttime, NOW()) > %s
        """,
        (payload.older_than_hours,),
    )
    return {"ok": True, "rows_affected": int(target["total"] if target else 0)}


class DeleteRecordsRequest(BaseModel):
    before_date: str


@router.post("/maintenance/delete-records", summary="Delete accounting records before date")
@router.post("/maintenance/delete-records/", include_in_schema=False)
def delete_records(payload: DeleteRecordsRequest):
    target = query(
        "SELECT COUNT(*) AS total FROM radacct WHERE DATE(acctstarttime) < %s",
        (payload.before_date,),
        fetchone=True,
    )
    execute(
        "DELETE FROM radacct WHERE DATE(acctstarttime) < %s",
        (payload.before_date,),
    )
    return {"ok": True, "rows_affected": int(target["total"] if target else 0)}
