#!/usr/bin/env python3
"""
SplitZ — Expense Sharing App
Python HTTP server: serves REST API + static frontend files.
Run:  python3 server.py
"""
import json
import os
import time
import mimetypes
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

from database import init_db, db
from auth import (
    hash_password, verify_password,
    sign_token, verify_token,
    get_token_from_header, get_token_from_cookie,
)
from balance import compute_balances

PORT = int(os.environ.get("PORT", 3000))
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def ts() -> int:
    return int(time.time() * 1000)


def row_to_dict(row) -> dict:
    if row is None:
        return None
    return dict(row)


def rows_to_list(rows) -> list:
    return [dict(r) for r in rows]


class RequestContext:
    def __init__(self, handler: "SplitZHandler"):
        self.handler = handler
        self.path = urlparse(handler.path).path
        self.query = parse_qs(urlparse(handler.path).query)
        self.method = handler.command
        self._body = None
        self._user = None

    def body(self) -> dict:
        if self._body is None:
            length = int(self.handler.headers.get("Content-Length", 0))
            raw = self.handler.rfile.read(length) if length else b""
            self._body = json.loads(raw) if raw else {}
        return self._body

    def user(self) -> dict | None:
        if self._user is not None:
            return self._user
        token = (
            get_token_from_header(dict(self.handler.headers))
            or get_token_from_cookie(self.handler.headers.get("Cookie", ""))
        )
        if not token:
            return None
        payload = verify_token(token)
        if not payload:
            return None
        self._user = payload
        return payload

    def require_user(self) -> dict:
        u = self.user()
        if not u:
            raise APIError(401, "Authentication required")
        return u

    def qs(self, key: str, default=None):
        return self.query.get(key, [default])[0]


class APIError(Exception):
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message


# ─── HTTP Handler ─────────────────────────────────────────────────────────────

class SplitZHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # quiet

    def send_json(self, data, status=200, headers=None):
        body = json.dumps(data, default=str).encode()
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
            if headers:
                for k, v in headers.items():
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def send_error_json(self, status, message):
        self.send_json({"error": message}, status)

    def serve_static(self, path: str):
        # SPA: any non-API, non-file path → index.html
        file_path = os.path.join(STATIC_DIR, path.lstrip("/"))
        if not os.path.isfile(file_path):
            file_path = os.path.join(STATIC_DIR, "index.html")
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            mime, _ = mimetypes.guess_type(file_path)
            try:
                self.send_response(200)
                self.send_header("Content-Type", mime or "text/html")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except (BrokenPipeError, ConnectionResetError):
                pass
        except FileNotFoundError:
            try:
                self.send_response(404)
                self.end_headers()
            except (BrokenPipeError, ConnectionResetError):
                pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.end_headers()

    def do_GET(self):
        self._handle()

    def do_POST(self):
        self._handle()

    def do_PATCH(self):
        self._handle()

    def do_DELETE(self):
        self._handle()

    def _handle(self):
        ctx = RequestContext(self)
        path = ctx.path

        if not path.startswith("/api/"):
            self.serve_static(path)
            return

        try:
            result = route(ctx)
            if result is None:
                self.send_error_json(404, "Not found")
            else:
                self.send_json(result)
        except APIError as e:
            self.send_error_json(e.status, e.message)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_error_json(500, str(e))


# ─── Router ───────────────────────────────────────────────────────────────────

def route(ctx: RequestContext):
    p = ctx.path
    m = ctx.method

    # Auth
    if p == "/api/auth/register"   and m == "POST":  return register(ctx)
    if p == "/api/auth/login"      and m == "POST":  return login(ctx)
    if p == "/api/auth/logout"     and m == "POST":  return logout(ctx)
    if p == "/api/users/me"        and m == "GET":   return get_me(ctx)
    if p == "/api/users/me"        and m == "PATCH": return update_me(ctx)

    # Friends
    if p == "/api/friends"         and m == "GET":   return list_friends(ctx)
    if p == "/api/friends"         and m == "POST":  return add_friend(ctx)
    if p == "/api/friends/requests" and m == "GET":  return list_friend_requests(ctx)
    if p == "/api/friends/requests" and m == "PATCH": return handle_friend_request(ctx)

    m2 = re.match(r"^/api/friends/(\d+)$", p)
    if m2 and m == "DELETE": return remove_friend(ctx, int(m2.group(1)))

    # Groups
    if p == "/api/groups"          and m == "GET":   return list_groups(ctx)
    if p == "/api/groups"          and m == "POST":  return create_group(ctx)

    mg = re.match(r"^/api/groups/(\d+)$", p)
    if mg:
        gid = int(mg.group(1))
        if m == "GET":    return get_group(ctx, gid)
        if m == "PATCH":  return update_group(ctx, gid)
        if m == "DELETE": return delete_group(ctx, gid)

    mgm = re.match(r"^/api/groups/(\d+)/members$", p)
    if mgm:
        gid = int(mgm.group(1))
        if m == "POST":   return add_group_member(ctx, gid)
        if m == "DELETE": return remove_group_member(ctx, gid)

    mge = re.match(r"^/api/groups/(\d+)/expenses$", p)
    if mge and m == "GET": return list_group_expenses(ctx, int(mge.group(1)))

    mgb = re.match(r"^/api/groups/(\d+)/balances$", p)
    if mgb and m == "GET": return get_group_balances(ctx, int(mgb.group(1)))

    mgs = re.match(r"^/api/groups/(\d+)/settle$", p)
    if mgs and m == "POST": return settle_group(ctx, int(mgs.group(1)))

    # Expenses
    if p == "/api/expenses"        and m == "GET":   return list_expenses(ctx)
    if p == "/api/expenses"        and m == "POST":  return create_expense(ctx)

    me_ = re.match(r"^/api/expenses/(\d+)$", p)
    if me_:
        eid = int(me_.group(1))
        if m == "GET":    return get_expense(ctx, eid)
        if m == "PATCH":  return update_expense(ctx, eid)
        if m == "DELETE": return delete_expense(ctx, eid)

    # Activity
    if p == "/api/activity"        and m == "GET":   return list_activity(ctx)

    return None


# ─── Auth handlers ────────────────────────────────────────────────────────────

def register(ctx: RequestContext):
    body = ctx.body()
    name     = (body.get("name") or "").strip()
    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not name or not email or not password:
        raise APIError(400, "name, email and password are required")
    if len(password) < 6:
        raise APIError(400, "Password must be at least 6 characters")
    if "@" not in email:
        raise APIError(400, "Invalid email")

    with db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
        if existing:
            raise APIError(409, "Email already registered")
        now = ts()
        cur = conn.execute(
            "INSERT INTO users (email,name,password_hash,created_at) VALUES (?,?,?,?)",
            (email, name, hash_password(password), now)
        )
        uid = cur.lastrowid
        user = row_to_dict(conn.execute("SELECT id,email,name,created_at FROM users WHERE id=?", (uid,)).fetchone())

    token = sign_token(uid, email)
    ctx.handler.send_response(201)
    ctx.handler.send_header("Content-Type", "application/json")
    ctx.handler.send_header("Set-Cookie", f"splitz_token={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={30*24*3600}")
    ctx.handler.send_header("Access-Control-Allow-Origin", "*")
    ctx.handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    body_bytes = json.dumps({"user": user, "token": token}).encode()
    ctx.handler.send_header("Content-Length", str(len(body_bytes)))
    ctx.handler.end_headers()
    ctx.handler.wfile.write(body_bytes)
    return None  # already sent


def login(ctx: RequestContext):
    body = ctx.body()
    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    with db() as conn:
        user = row_to_dict(conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone())

    if not user or not verify_password(password, user["password_hash"]):
        raise APIError(401, "Invalid credentials")

    token = sign_token(user["id"], user["email"])
    safe  = {k: v for k, v in user.items() if k != "password_hash"}
    ctx.handler.send_response(200)
    ctx.handler.send_header("Content-Type", "application/json")
    ctx.handler.send_header("Set-Cookie", f"splitz_token={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={30*24*3600}")
    ctx.handler.send_header("Access-Control-Allow-Origin", "*")
    ctx.handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    body_bytes = json.dumps({"user": safe, "token": token}).encode()
    ctx.handler.send_header("Content-Length", str(len(body_bytes)))
    ctx.handler.end_headers()
    ctx.handler.wfile.write(body_bytes)
    return None


def logout(ctx: RequestContext):
    ctx.handler.send_response(200)
    ctx.handler.send_header("Content-Type", "application/json")
    ctx.handler.send_header("Set-Cookie", "splitz_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
    ctx.handler.send_header("Access-Control-Allow-Origin", "*")
    body_bytes = json.dumps({"ok": True}).encode()
    ctx.handler.send_header("Content-Length", str(len(body_bytes)))
    ctx.handler.end_headers()
    ctx.handler.wfile.write(body_bytes)
    return None


def get_me(ctx: RequestContext):
    u = ctx.require_user()
    with db() as conn:
        user = row_to_dict(conn.execute(
            "SELECT id,email,name,created_at FROM users WHERE id=?", (u["sub"],)
        ).fetchone())
    return {"user": user}


def update_me(ctx: RequestContext):
    u = ctx.require_user()
    body = ctx.body()
    name = (body.get("name") or "").strip()
    if not name:
        raise APIError(400, "name is required")
    with db() as conn:
        conn.execute("UPDATE users SET name=? WHERE id=?", (name, u["sub"]))
        user = row_to_dict(conn.execute(
            "SELECT id,email,name,created_at FROM users WHERE id=?", (u["sub"],)
        ).fetchone())
    return {"user": user}


# ─── Friend handlers ──────────────────────────────────────────────────────────

def list_friends(ctx: RequestContext):
    u = ctx.require_user()
    with db() as conn:
        rows = conn.execute("""
            SELECT u.id, u.name, u.email, f.created_at as since
            FROM friendships f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = ?
            ORDER BY u.name
        """, (u["sub"],)).fetchall()
    return {"friends": rows_to_list(rows)}


def add_friend(ctx: RequestContext):
    u = ctx.require_user()
    body  = ctx.body()
    email = (body.get("email") or "").strip().lower()
    if not email:
        raise APIError(400, "email is required")

    with db() as conn:
        target = row_to_dict(conn.execute("SELECT id,name,email FROM users WHERE email=?", (email,)).fetchone())
        if not target:
            raise APIError(404, "User not found")
        if target["id"] == u["sub"]:
            raise APIError(400, "You cannot add yourself")

        # Check already friends
        existing = conn.execute(
            "SELECT id FROM friendships WHERE user_id=? AND friend_id=?",
            (u["sub"], target["id"])
        ).fetchone()
        if existing:
            raise APIError(409, "Already friends")

        # Check pending request
        pending = conn.execute(
            "SELECT id FROM friend_requests WHERE from_user_id=? AND to_user_id=? AND status='pending'",
            (u["sub"], target["id"])
        ).fetchone()
        if pending:
            raise APIError(409, "Friend request already sent")

        # If they already sent us a request, auto-accept
        their_request = conn.execute(
            "SELECT id FROM friend_requests WHERE from_user_id=? AND to_user_id=? AND status='pending'",
            (target["id"], u["sub"])
        ).fetchone()

        now = ts()
        if their_request:
            conn.execute("UPDATE friend_requests SET status='accepted' WHERE id=?", (their_request["id"],))
            conn.execute("INSERT OR IGNORE INTO friendships (user_id,friend_id,created_at) VALUES (?,?,?)", (u["sub"], target["id"], now))
            conn.execute("INSERT OR IGNORE INTO friendships (user_id,friend_id,created_at) VALUES (?,?,?)", (target["id"], u["sub"], now))
            _log(conn, "friend_added", u["sub"], target["id"], None, {"name": target["name"]})
            return {"friend": target, "auto_accepted": True}
        else:
            conn.execute(
                "INSERT INTO friend_requests (from_user_id,to_user_id,status,created_at) VALUES (?,?,?,?)",
                (u["sub"], target["id"], "pending", now)
            )
            _log(conn, "friend_request_sent", u["sub"], target["id"], None, {"name": target["name"]})
            return {"message": "Friend request sent", "target": target}


def list_friend_requests(ctx: RequestContext):
    u = ctx.require_user()
    with db() as conn:
        rows = conn.execute("""
            SELECT fr.id, fr.created_at, u.id as from_id, u.name as from_name, u.email as from_email
            FROM friend_requests fr
            JOIN users u ON u.id = fr.from_user_id
            WHERE fr.to_user_id=? AND fr.status='pending'
            ORDER BY fr.created_at DESC
        """, (u["sub"],)).fetchall()
    return {"requests": rows_to_list(rows)}


def handle_friend_request(ctx: RequestContext):
    u = ctx.require_user()
    body      = ctx.body()
    req_id    = body.get("requestId")
    action    = body.get("action")  # 'accept' | 'reject'
    if not req_id or action not in ("accept", "reject"):
        raise APIError(400, "requestId and action (accept|reject) required")

    with db() as conn:
        req = row_to_dict(conn.execute("SELECT * FROM friend_requests WHERE id=?", (req_id,)).fetchone())
        if not req or req["to_user_id"] != u["sub"]:
            raise APIError(404, "Request not found")
        if req["status"] != "pending":
            raise APIError(409, "Request already handled")

        now = ts()
        if action == "accept":
            conn.execute("UPDATE friend_requests SET status='accepted' WHERE id=?", (req_id,))
            conn.execute("INSERT OR IGNORE INTO friendships (user_id,friend_id,created_at) VALUES (?,?,?)",
                         (u["sub"], req["from_user_id"], now))
            conn.execute("INSERT OR IGNORE INTO friendships (user_id,friend_id,created_at) VALUES (?,?,?)",
                         (req["from_user_id"], u["sub"], now))
            _log(conn, "friend_added", u["sub"], req["from_user_id"], None, {})
        else:
            conn.execute("UPDATE friend_requests SET status='rejected' WHERE id=?", (req_id,))

    return {"ok": True}


def remove_friend(ctx: RequestContext, friend_id: int):
    u = ctx.require_user()
    with db() as conn:
        conn.execute("DELETE FROM friendships WHERE user_id=? AND friend_id=?", (u["sub"], friend_id))
        conn.execute("DELETE FROM friendships WHERE user_id=? AND friend_id=?", (friend_id, u["sub"]))
    return {"ok": True}


# ─── Group handlers ───────────────────────────────────────────────────────────

def list_groups(ctx: RequestContext):
    u = ctx.require_user()
    with db() as conn:
        rows = conn.execute("""
            SELECT g.id, g.name, g.description, g.created_at,
                   (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id=g.id) as member_count
            FROM groups g
            JOIN group_members gm ON gm.group_id=g.id AND gm.user_id=?
            ORDER BY g.updated_at DESC
        """, (u["sub"],)).fetchall()
    return {"groups": rows_to_list(rows)}


def create_group(ctx: RequestContext):
    u = ctx.require_user()
    body = ctx.body()
    name = (body.get("name") or "").strip()
    if not name:
        raise APIError(400, "name is required")
    description = (body.get("description") or "").strip()
    member_ids  = body.get("memberIds", [])

    now = ts()
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO groups (name,description,created_by,created_at,updated_at) VALUES (?,?,?,?,?)",
            (name, description, u["sub"], now, now)
        )
        gid = cur.lastrowid
        # Add creator as admin
        conn.execute("INSERT INTO group_members (group_id,user_id,joined_at,role) VALUES (?,?,?,?)",
                     (gid, u["sub"], now, "admin"))
        # Add extra members
        for mid in member_ids:
            if mid != u["sub"]:
                conn.execute("INSERT OR IGNORE INTO group_members (group_id,user_id,joined_at,role) VALUES (?,?,?,?)",
                             (gid, mid, now, "member"))
        _log(conn, "group_created", u["sub"], gid, gid, {"name": name})
        group = row_to_dict(conn.execute("SELECT * FROM groups WHERE id=?", (gid,)).fetchone())
    return {"group": group}


def get_group(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    with db() as conn:
        _assert_member(conn, group_id, u["sub"])
        group = row_to_dict(conn.execute("SELECT * FROM groups WHERE id=?", (group_id,)).fetchone())
        if not group:
            raise APIError(404, "Group not found")
        members = rows_to_list(conn.execute("""
            SELECT u.id, u.name, u.email, gm.role, gm.joined_at
            FROM group_members gm JOIN users u ON u.id=gm.user_id
            WHERE gm.group_id=?
            ORDER BY gm.joined_at
        """, (group_id,)).fetchall())
    return {"group": group, "members": members}


def update_group(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    body = ctx.body()
    with db() as conn:
        _assert_member(conn, group_id, u["sub"])
        fields, vals = [], []
        if "name" in body:
            fields.append("name=?"); vals.append(body["name"].strip())
        if "description" in body:
            fields.append("description=?"); vals.append(body["description"])
        if not fields:
            raise APIError(400, "Nothing to update")
        fields.append("updated_at=?"); vals.append(ts())
        vals.append(group_id)
        conn.execute(f"UPDATE groups SET {', '.join(fields)} WHERE id=?", vals)
        group = row_to_dict(conn.execute("SELECT * FROM groups WHERE id=?", (group_id,)).fetchone())
    return {"group": group}


def delete_group(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    with db() as conn:
        role = conn.execute(
            "SELECT role FROM group_members WHERE group_id=? AND user_id=?", (group_id, u["sub"])
        ).fetchone()
        if not role or role["role"] != "admin":
            raise APIError(403, "Only group admin can delete the group")
        conn.execute("DELETE FROM groups WHERE id=?", (group_id,))
    return {"ok": True}


def add_group_member(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    body    = ctx.body()
    user_id = body.get("userId")
    if not user_id:
        raise APIError(400, "userId required")
    with db() as conn:
        _assert_member(conn, group_id, u["sub"])
        existing = conn.execute(
            "SELECT id FROM group_members WHERE group_id=? AND user_id=?", (group_id, user_id)
        ).fetchone()
        if existing:
            raise APIError(409, "User already in group")
        conn.execute("INSERT INTO group_members (group_id,user_id,joined_at,role) VALUES (?,?,?,?)",
                     (group_id, user_id, ts(), "member"))
        _log(conn, "member_added", u["sub"], user_id, group_id, {})
    return {"ok": True}


def remove_group_member(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    body    = ctx.body()
    user_id = body.get("userId")
    if not user_id:
        raise APIError(400, "userId required")
    with db() as conn:
        conn.execute("DELETE FROM group_members WHERE group_id=? AND user_id=?", (group_id, user_id))
    return {"ok": True}


def list_group_expenses(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    limit  = int(ctx.qs("limit", "20"))
    offset = int(ctx.qs("offset", "0"))
    with db() as conn:
        _assert_member(conn, group_id, u["sub"])
        rows = conn.execute("""
            SELECT e.*, u.name as paid_by_name
            FROM expenses e
            JOIN users u ON u.id=e.paid_by
            WHERE e.group_id=? AND e.is_deleted=0
            ORDER BY e.expense_date DESC, e.created_at DESC
            LIMIT ? OFFSET ?
        """, (group_id, limit, offset)).fetchall()
        total = conn.execute(
            "SELECT COUNT(*) FROM expenses WHERE group_id=? AND is_deleted=0", (group_id,)
        ).fetchone()[0]
    return {"expenses": rows_to_list(rows), "total": total}


def get_group_balances(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    with db() as conn:
        _assert_member(conn, group_id, u["sub"])
        members = rows_to_list(conn.execute(
            "SELECT user_id FROM group_members WHERE group_id=?", (group_id,)
        ).fetchall())
        user_ids = [m["user_id"] for m in members]

        exps = rows_to_list(conn.execute(
            "SELECT id, paid_by FROM expenses WHERE group_id=? AND is_deleted=0", (group_id,)
        ).fetchall())
        for exp in exps:
            splits = rows_to_list(conn.execute(
                "SELECT user_id, amount FROM expense_splits WHERE expense_id=?", (exp["id"],)
            ).fetchall())
            exp["splits"] = splits

        setts = rows_to_list(conn.execute(
            "SELECT from_user, to_user, amount FROM settlements WHERE group_id=?", (group_id,)
        ).fetchall())

        # Get user names
        user_names = {r["id"]: r["name"] for r in conn.execute(
            "SELECT id, name FROM users WHERE id IN (%s)" % ",".join("?" * len(user_ids)), user_ids
        ).fetchall()}

    result = compute_balances(exps, setts, user_ids)
    # Attach names
    for s in result["settlements"]:
        s["from_name"] = user_names.get(s["from_user_id"], "?")
        s["to_name"]   = user_names.get(s["to_user_id"], "?")
    for p in result["per_person"]:
        p["name"] = user_names.get(p["user_id"], "?")
    return result


def settle_group(ctx: RequestContext, group_id: int):
    u = ctx.require_user()
    body     = ctx.body()
    to_user  = body.get("toUserId")
    amount   = body.get("amount")
    note     = body.get("note", "")
    if not to_user or not amount:
        raise APIError(400, "toUserId and amount required")
    now = ts()
    with db() as conn:
        _assert_member(conn, group_id, u["sub"])
        conn.execute("""
            INSERT INTO settlements (group_id,from_user,to_user,amount,currency,note,created_by,created_at)
            VALUES (?,?,?,?,?,?,?,?)
        """, (group_id, u["sub"], to_user, int(amount), "BRL", note, u["sub"], now))
        sid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        _log(conn, "settlement", u["sub"], sid, group_id, {"amount": amount, "to_user": to_user})
    return {"ok": True}


# ─── Expense handlers ─────────────────────────────────────────────────────────

def list_expenses(ctx: RequestContext):
    u   = ctx.require_user()
    gid = ctx.qs("groupId")
    limit  = int(ctx.qs("limit", "20"))
    offset = int(ctx.qs("offset", "0"))
    with db() as conn:
        if gid:
            rows = conn.execute("""
                SELECT e.*, u.name as paid_by_name
                FROM expenses e JOIN users u ON u.id=e.paid_by
                WHERE e.group_id=? AND e.is_deleted=0
                ORDER BY e.expense_date DESC LIMIT ? OFFSET ?
            """, (int(gid), limit, offset)).fetchall()
        else:
            rows = conn.execute("""
                SELECT e.*, u.name as paid_by_name
                FROM expenses e JOIN users u ON u.id=e.paid_by
                WHERE (e.paid_by=? OR EXISTS(
                    SELECT 1 FROM expense_splits es WHERE es.expense_id=e.id AND es.user_id=?
                )) AND e.is_deleted=0
                ORDER BY e.expense_date DESC LIMIT ? OFFSET ?
            """, (u["sub"], u["sub"], limit, offset)).fetchall()
    return {"expenses": rows_to_list(rows)}


def create_expense(ctx: RequestContext):
    u    = ctx.require_user()
    body = ctx.body()
    title      = (body.get("title") or "").strip()
    amount     = body.get("amount")
    group_id   = body.get("groupId")
    paid_by    = body.get("paidBy", u["sub"])
    split_type = body.get("splitType", "equal")
    splits_in  = body.get("splits", [])
    date       = body.get("date", ts())
    description= body.get("description", "")

    if not title:  raise APIError(400, "title required")
    if not amount: raise APIError(400, "amount required")
    amount = int(amount)
    if amount <= 0: raise APIError(400, "amount must be positive")

    # Validate splits
    if splits_in:
        total_splits = sum(int(s.get("amount", 0)) for s in splits_in)
        if abs(total_splits - amount) > 1:  # allow 1 cent rounding
            raise APIError(400, f"Splits sum ({total_splits}) must equal amount ({amount})")

    now = ts()
    with db() as conn:
        if group_id:
            _assert_member(conn, int(group_id), u["sub"])
        cur = conn.execute("""
            INSERT INTO expenses (group_id,title,description,amount,paid_by,split_type,expense_date,created_by,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (group_id, title, description, amount, paid_by, split_type, date, u["sub"], now, now))
        eid = cur.lastrowid

        for s in splits_in:
            conn.execute(
                "INSERT INTO expense_splits (expense_id,user_id,amount,percent) VALUES (?,?,?,?)",
                (eid, s["user_id"], int(s.get("amount", 0)), s.get("percent"))
            )
        _log(conn, "expense_added", u["sub"], eid, group_id, {"title": title, "amount": amount})
        expense = row_to_dict(conn.execute("SELECT * FROM expenses WHERE id=?", (eid,)).fetchone())
    return {"expense": expense}


def get_expense(ctx: RequestContext, expense_id: int):
    u = ctx.require_user()
    with db() as conn:
        exp = row_to_dict(conn.execute(
            "SELECT e.*, u.name as paid_by_name FROM expenses e JOIN users u ON u.id=e.paid_by WHERE e.id=?",
            (expense_id,)
        ).fetchone())
        if not exp or exp["is_deleted"]:
            raise APIError(404, "Expense not found")
        splits = rows_to_list(conn.execute("""
            SELECT es.*, u.name as user_name FROM expense_splits es
            JOIN users u ON u.id=es.user_id WHERE es.expense_id=?
        """, (expense_id,)).fetchall())
    return {"expense": exp, "splits": splits}


def update_expense(ctx: RequestContext, expense_id: int):
    u    = ctx.require_user()
    body = ctx.body()
    with db() as conn:
        exp = row_to_dict(conn.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone())
        if not exp or exp["is_deleted"]:
            raise APIError(404, "Expense not found")
        if exp["created_by"] != u["sub"]:
            raise APIError(403, "Not your expense")
        fields, vals = [], []
        for key in ("title", "description", "amount", "split_type"):
            if key in body:
                fields.append(f"{key}=?"); vals.append(body[key])
        fields.append("updated_at=?"); vals.append(ts())
        vals.append(expense_id)
        conn.execute(f"UPDATE expenses SET {', '.join(fields)} WHERE id=?", vals)

        if "splits" in body:
            conn.execute("DELETE FROM expense_splits WHERE expense_id=?", (expense_id,))
            for s in body["splits"]:
                conn.execute(
                    "INSERT INTO expense_splits (expense_id,user_id,amount,percent) VALUES (?,?,?,?)",
                    (expense_id, s["user_id"], int(s.get("amount", 0)), s.get("percent"))
                )
        exp = row_to_dict(conn.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone())
    return {"expense": exp}


def delete_expense(ctx: RequestContext, expense_id: int):
    u = ctx.require_user()
    with db() as conn:
        exp = row_to_dict(conn.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone())
        if not exp:
            raise APIError(404, "Not found")
        if exp["created_by"] != u["sub"]:
            raise APIError(403, "Not your expense")
        conn.execute("UPDATE expenses SET is_deleted=1, updated_at=? WHERE id=?", (ts(), expense_id))
        _log(conn, "expense_deleted", u["sub"], expense_id, exp["group_id"], {})
    return {"ok": True}


# ─── Activity handler ─────────────────────────────────────────────────────────

def list_activity(ctx: RequestContext):
    u   = ctx.require_user()
    gid = ctx.qs("groupId")
    limit = int(ctx.qs("limit", "20"))
    with db() as conn:
        if gid:
            rows = conn.execute("""
                SELECT a.*, u.name as actor_name
                FROM activity_log a JOIN users u ON u.id=a.actor_id
                WHERE a.group_id=?
                ORDER BY a.created_at DESC LIMIT ?
            """, (int(gid), limit)).fetchall()
        else:
            rows = conn.execute("""
                SELECT a.*, u.name as actor_name
                FROM activity_log a JOIN users u ON u.id=a.actor_id
                WHERE a.actor_id=? OR a.group_id IN (
                    SELECT group_id FROM group_members WHERE user_id=?
                )
                ORDER BY a.created_at DESC LIMIT ?
            """, (u["sub"], u["sub"], limit)).fetchall()
    items = rows_to_list(rows)
    for item in items:
        if item.get("metadata"):
            try:
                item["metadata"] = json.loads(item["metadata"])
            except Exception:
                pass
    return {"activity": items}


# ─── Utility ──────────────────────────────────────────────────────────────────

def _assert_member(conn, group_id: int, user_id: int):
    row = conn.execute(
        "SELECT id FROM group_members WHERE group_id=? AND user_id=?", (group_id, user_id)
    ).fetchone()
    if not row:
        raise APIError(403, "Not a member of this group")


def _log(conn, event_type: str, actor_id: int, target_id, group_id, metadata: dict):
    conn.execute(
        "INSERT INTO activity_log (type,actor_id,target_id,group_id,metadata,created_at) VALUES (?,?,?,?,?,?)",
        (event_type, actor_id, target_id, group_id, json.dumps(metadata), ts())
    )


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Initialising database…")
    init_db()
    print(f"SplitZ running at http://localhost:{PORT}")
    print("Open on your phone: find your local IP and use http://<IP>:3000")
    server = HTTPServer(("0.0.0.0", PORT), SplitZHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown")
