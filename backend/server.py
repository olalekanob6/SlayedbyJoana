from dotenv import load_dotenv
load_dotenv()

import os
import re
import uuid
import logging
import ipaddress
import asyncio
import time
import io
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from copy import deepcopy

import bcrypt
import jwt
import httpx
import requests
import stripe
import cloudinary
import cloudinary.uploader
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.responses import Response as RawResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Auth ----------------
JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class LoginIn(BaseModel):
    email: EmailStr
    password: str

@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower().strip()
    identifier = f"{request.client.host}:{email}"
    att = await db.login_attempts.find_one({"identifier": identifier})
    if att and att.get("count", 0) >= 5:
        locked_until = att.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Demasiados intentos. Inténtalo de nuevo en 15 minutos.")
    user = await db.users.find_one({"email": email})
    if (not user or not user.get("password_hash") or
            not verify_password(payload.password, user["password_hash"]) or
            user.get("role") != "admin" or email not in ADMIN_EMAILS):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True)
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(user["id"], email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True,
                        samesite="none", max_age=7 * 24 * 3600, path="/")
    return {"id": user["id"], "email": email, "name": user.get("name", "Joana"), "role": user.get("role", "admin")}

ADMIN_EMAILS = set(filter(None, [e.strip().lower() for e in
    (os.environ.get("ADMIN_EMAILS", "") + "," + os.environ.get("ADMIN_EMAIL", "")).split(",")]))

async def get_google_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sesión no válida")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sesión caducada")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

async def get_admin_user(request: Request) -> dict:
    try:
        user = await get_current_user(request)
    except HTTPException:
        user = await get_google_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Sin permisos de administración")
    return user

@api_router.get("/auth/me")
async def auth_me(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        pass
    return await get_google_user(request)

class GoogleSessionIn(BaseModel):
    session_id: str

@api_router.post("/auth/google/session")
async def google_session(payload: GoogleSessionIn, response: Response):
    async with httpx.AsyncClient(timeout=20) as http_client:
        r = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Sesión de Google no válida")
    data = r.json()
    email = data["email"].lower().strip()
    role = "admin" if email in ADMIN_EMAILS else "client"
    user = await db.users.find_one({"email": email})
    if user:
        user_id = user.get("user_id") or user.get("id")
        await db.users.update_one({"email": email}, {"$set": {
            "user_id": user_id, "name": data.get("name", ""), "picture": data.get("picture", ""), "role": role}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({"user_id": user_id, "email": email, "name": data.get("name", ""),
                                   "picture": data.get("picture", ""), "role": role,
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": data["session_token"],
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)})
    response.set_cookie(key="session_token", value=data["session_token"], httponly=True,
                        secure=True, samesite="none", max_age=7 * 24 * 3600, path="/")
    return {"user_id": user_id, "email": email, "name": data.get("name", ""),
            "picture": data.get("picture", ""), "role": role}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/")
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

# ---------------- Email (Emergent managed Resend) ----------------
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Slayed by Joana17")
SITE_URL = os.environ["SITE_URL"]
OWNER_NOTIFY_EMAIL = os.environ.get("OWNER_NOTIFY_EMAIL", "").strip()

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)

def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)

def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)

class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []

def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")

_email_lock = asyncio.Lock()
_last_email_sent_at = 0.0
EMAIL_MIN_INTERVAL_SECONDS = 1.0

async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    global _last_email_sent_at
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    async with _email_lock:
        for attempt in range(3):
            wait = EMAIL_MIN_INTERVAL_SECONDS - (time.monotonic() - _last_email_sent_at)
            if wait > 0:
                await asyncio.sleep(wait)
            async with httpx.AsyncClient(timeout=30) as http_client:
                resp = await http_client.post(
                    f"{EMAIL_BASE_URL}/api/v1/email/send",
                    headers={"X-Email-Key": EMAIL_KEY},
                    json=payload,
                )
            _last_email_sent_at = time.monotonic()
            if resp.status_code == 429 and attempt < 2:
                await asyncio.sleep(2 * (attempt + 1))
                continue
            resp.raise_for_status()
            return resp.json().get("id")
    raise RuntimeError("Email send failed after retries")

SIZES = ["Pequeño", "S.Mediano", "Mediano", "Grande"]

EXTRAS_BOOK = {
    "extra-pequeno": ("Extra pequeño", 20), "extra-largura": ("Extra largura", 20),
    "rizos-puntas": ("Rizos en las puntas", 5), "kanekalon-lisa": ("Kanekalon lisa", 6),
    "kanekalon-rizada": ("Kanekalon rizada", 15), "kanekalon-afro": ("Kanekalon afro", 15),
    "diseno": ("Diseño personalizado", 5), "estilizar": ("Estilizado", 10),
}

PRICE_BOOK = {
    "Knotless": {"matrix": True, "lengths": {"Hombro": [65,55,50,45], "Espalda": [75,65,60,55], "Cintura": [85,75,70,65], "Glúteos": [95,85,80,75]}, "base": 45},
    "Box Braids Mujer": {"matrix": True, "lengths": {"Hombro": [55,50,45,40], "Espalda": [65,60,55,50], "Cintura": [75,70,65,60], "Glúteos": [85,80,75,70]}, "base": 40},
    "Boho": {"matrix": True, "lengths": {"Hombro": [75,65,60,55], "Espalda": [85,75,70,65], "Cintura": [95,85,80,75], "Glúteos": [105,95,90,85]}, "base": 55},
    "Boho Twist": {"matrix": True, "lengths": {"Hombro": [65,60,55,50], "Espalda": [75,70,65,60], "Cintura": [85,80,75,70], "Glúteos": [95,90,85,80]}, "base": 50},
    "Twist": {"matrix": True, "lengths": {"Hombro": [55,50,45,40], "Espalda": [65,60,55,50], "Cintura": [75,70,65,60], "Glúteos": [85,80,75,70]}, "base": 40},
    "Miracle K": {"sizes": [120,110,100,90], "base": 90},
    "B.Locs": {"sizes": [150,120,100,80], "base": 80},
    "Cornrows": {"options": {"Trenzas boxeadoras": 30, "4-6 cornrows": 45, "8-10 cornrows": 50, "+10 cornrows": 65, "Trenzas para peluca": 15}, "base": 30},
    "Wig Inst": {"options": {"Instalación completa": 50, "Instalación + estilo": 35}, "base": 35},
    "Fulani": {"base": 85},
    "Coletas": {"base": 25},
    "Coleta Trenzada": {"base": 70},
    "Crochet": {"base": 85},
    "Half Up": {"base": 45},
    "Box Braids": {"options": {"Pequeño": 40, "Mediano": 35, "Grande": 30}, "base": 30},
    "Twist Hombre": {"options": {"Pequeño": 35, "Mediano": 30, "Grande": 25}, "base": 25},
    "Barrel": {"options": {"4 barrel": 35, "6 barrel": 40, "+8 barrel": 45}, "base": 35},
    "Cornrows Hombre": {"options": {"4 cornrows": 30, "6 cornrows": 35, "+8 cornrows": 40}, "base": 30},
    "2 Strand Twist": {"options": {"Pequeño": 45, "Mediano": 40, "Grande": 35}, "base": 35},
    "Fulani Hombre": {"base": 45},
    "Retwist (Peine)": {"options": {"40-60 locs": 30, "60-80 locs": 40, "80-100 locs": 50, "+100 locs": 60}, "base": 30},
    "Retwist (Crochet)": {"options": {"40-60 locs": 50, "60-80 locs": 60, "80-100 locs": 70, "+100 locs": 80}, "base": 50},
    "St Locks": {"options": {"40-60 locs": 50, "60-80 locs": 60, "80-100 locs": 70, "+100 locs": 80}, "base": 50},
    "Instant Locs": {"options": {"40-60 locs": 60, "60-80 locs": 80, "80-100 locs": 100, "+100 locs": 120}, "base": 60},
    "Inst. Extension": {"options": {"40-60 locs": 70, "60-80 locs": 90, "80-100 locs": 110, "+100 locs": 130}, "base": 70},
    "Kanekalon / Extensión": {"options": {"Lisa": 6, "Rizada": 15, "Afro": 15}, "base": 6},
    "Rizos en las puntas": {"base": 5},
    "Extra pequeño / Extra largura": {"base": 20},
    "Diseño personalizado": {"base": 5},
    "Arreglo de rastas": {"base": 3},
    "Detox de Locs": {"base": 35},
    "Corte de pelo": {"base": 8},
    "Cerquillo": {"base": 5},
}

DEFAULT_DEPOSIT = 20

def normalized_extras(extras=None) -> list[tuple[str, int]]:
    normalized = []
    for item in extras or []:
        if hasattr(item, "id"):
            extra_id, qty = item.id, getattr(item, "qty", 1)
        elif isinstance(item, dict):
            extra_id, qty = item.get("id"), item.get("qty", 1)
        else:
            extra_id, qty = str(item), 1
        if extra_id in EXTRAS_BOOK:
            normalized.append((extra_id, max(1, min(10, int(qty or 1)))))
    return normalized


DEFAULT_THEME = {
    "accent": "#E56B9E",
    "background": "#FFFFFF",
    "surface": "#FFF3F7",
    "text": "#2E2126",
    "muted": "#97707F",
    "border": "#F5D3E2",
}

def money_label(amount: float) -> str:
    return str(int(amount)) if amount == int(amount) else f"{amount:.2f}".replace(".", ",")


DEFAULT_SERVICE_DURATIONS = {
    "Knotless": 300, "Box Braids Mujer": 300, "Boho": 300, "Boho Twist": 300,
    "Twist": 270, "Miracle K": 360, "B.Locs": 360, "Cornrows": 180,
    "Wig Inst": 120, "Fulani": 330, "Coletas": 120, "Coleta Trenzada": 180,
    "Crochet": 210, "Half Up": 150, "Box Braids": 150, "Twist Hombre": 150,
    "Barrel": 120, "Cornrows Hombre": 120, "2 Strand Twist": 150, "Fulani Hombre": 150,
    "Retwist (Peine)": 150, "Retwist (Crochet)": 180, "St Locks": 240,
    "Instant Locs": 240, "Inst. Extension": 300, "Kanekalon / Extensión": 30,
    "Rizos en las puntas": 30, "Extra pequeño / Extra largura": 30,
    "Diseño personalizado": 30, "Arreglo de rastas": 30, "Detox de Locs": 45,
    "Corte de pelo": 15, "Cerquillo": 10,
}

def default_extras_prices() -> dict[str, float]:
    return {extra_id: float(price) for extra_id, (_, price) in EXTRAS_BOOK.items()}

def merge_dict_deep(base: dict, override: dict) -> dict:
    merged = deepcopy(base)
    for key, value in (override or {}).items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = merge_dict_deep(merged[key], value)
        else:
            merged[key] = value
    return merged

def validate_price_tree(value: Any, path: str = "price") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            validate_price_tree(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            validate_price_tree(child, f"{path}[{index}]")
    elif isinstance(value, (int, float)) and not isinstance(value, bool):
        if not 0 <= float(value) <= 1000:
            raise HTTPException(status_code=400, detail=f"El precio {path} debe estar entre 0 y 1000")


def compute_total(service: str, length: str = "", size: str = "", extras=None,
                  price_book: dict | None = None, extras_prices: dict | None = None) -> float:
    books = price_book or PRICE_BOOK
    extra_prices = extras_prices or default_extras_prices()
    book = books.get(service)
    base = 0.0
    if book:
        if book.get("matrix"):
            row = book["lengths"].get(length)
            base = float(row[SIZES.index(size)]) if row and size in SIZES else float(book["base"])
        elif "sizes" in book:
            base = float(book["sizes"][SIZES.index(size)]) if size in SIZES else float(book["base"])
        elif "options" in book:
            base = float(book["options"].get(length, book["base"]))
        else:
            base = float(book["base"])
    extras_total = sum(float(extra_prices.get(extra_id, EXTRAS_BOOK[extra_id][1])) * qty
                       for extra_id, qty in normalized_extras(extras))
    return base + extras_total

def pay_label_for(b: dict) -> str:
    total = float(b.get("total_amount") or b.get("deposit_amount") or 0)
    deposit = float(b.get("deposit_amount") or total / 2)
    remaining = float(b.get("remaining_amount") if b.get("remaining_amount") is not None else total - deposit)
    method = b.get("payment_method")
    if method == "bizum":
        return f"Bizum: señal {money_label(deposit)} EUR; resto {money_label(remaining)} EUR en el estudio"
    if method == "online":
        return f"Tarjeta: señal {money_label(deposit)} EUR; resto {money_label(remaining)} EUR en el estudio"
    return f"Efectivo en el estudio ({money_label(total)} EUR)"

async def notify_owner_booking(b: dict) -> bool:
    settings = await db.settings.find_one({"id": "site"}, {"_id": 0}) or {}
    to_email = (settings.get("owner_notify_email") or OWNER_NOTIFY_EMAIL).strip()
    if not to_email:
        logger.warning("No notification email configured; booking %s saved without email notification", b["id"])
        return False
    pay_label = pay_label_for(b)
    subject = f"Nueva reserva: {b['service']} - {b['date']} {b['time']}"
    html = (
        '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#1a1a1a">'
        f'<h2 style="margin:0 0 12px">Nueva reserva web</h2>'
        f'<p style="margin:0 0 8px"><strong>Servicio:</strong> {escape(b["service"])}</p>'
        f'<p style="margin:0 0 8px"><strong>Cliente:</strong> {escape(b["name"])}</p>'
        f'<p style="margin:0 0 8px"><strong>Telefono:</strong> {escape(b["phone"])}</p>'
        f'<p style="margin:0 0 8px"><strong>Email:</strong> {escape(b.get("email") or "-")}</p>'
        f'<p style="margin:0 0 8px"><strong>Fecha y hora:</strong> {escape(b["date"])} - {escape(b["time"])}</p>'
        f'<p style="margin:0 0 8px"><strong>Pago:</strong> {escape(pay_label)}</p>'
        f'<p style="margin:0 0 8px"><strong>Notas:</strong> {escape(b.get("notes") or "-")}</p>'
        f'<p style="font-size:12px;color:#888;margin-top:16px">Enviado por {escape(EMAIL_FROM_NAME)} - panel de reservas web.</p>'
        '</td></tr></table>'
    )
    try:
        await send_email(to=to_email, subject=subject, html=html)
        return True
    except Exception as e:
        logger.error("Owner notification failed for booking %s: %s", b["id"], e)
        return False

async def send_confirmation_email(b: dict) -> None:
    if not b.get("email"):
        return
    subject = f"Cita confirmada - {b['date']} {b['time']}"
    html = (
        '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#1a1a1a">'
        f'<h2 style="margin:0 0 12px">Tu cita esta confirmada</h2>'
        f'<p style="margin:0 0 8px">Hola {escape(b["name"])}, Joana ha confirmado tu cita:</p>'
        f'<p style="margin:0 0 8px"><strong>Servicio:</strong> {escape(b["service"])}<br>'
        f'<strong>Fecha:</strong> {escape(b["date"])}<br>'
        f'<strong>Hora:</strong> {escape(b["time"])}</p>'
        '<p style="margin:0 0 8px">Te esperamos en el estudio. Si necesitas cambiar o cancelar, avisanos cuanto antes.</p>'
        '<hr style="border:none;border-top:1px solid #eee;margin:16px 0">'
        f'<p style="margin:0;color:#555">Hi {escape(b["name"])}, your appointment is confirmed: '
        f'{escape(b["service"])} on {escape(b["date"])} at {escape(b["time"])}. '
        'See you at the studio! If you need to change or cancel, please let us know as soon as possible.</p>'
        f'<p style="font-size:12px;color:#888;margin-top:16px">Enviado por {escape(EMAIL_FROM_NAME)}.</p>'
        '</td></tr></table>'
    )
    await send_email(to=b["email"], subject=subject, html=html)

async def send_cancellation_email(b: dict) -> None:
    if not b.get("email"):
        return
    subject = f"Cita cancelada - {b['date']} {b['time']}"
    html = (
        '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#1a1a1a">'
        f'<h2 style="margin:0 0 12px">Tu cita ha sido cancelada</h2>'
        f'<p style="margin:0 0 8px">Hola {escape(b["name"])}, te avisamos de que tu cita ha sido cancelada:</p>'
        f'<p style="margin:0 0 8px"><strong>Servicio:</strong> {escape(b["service"])}<br>'
        f'<strong>Fecha:</strong> {escape(b["date"])}<br>'
        f'<strong>Hora:</strong> {escape(b["time"])}</p>'
        '<p style="margin:0 0 8px">Si quieres, puedes reservar un nuevo hueco desde la web. Disculpa las molestias.</p>'
        '<hr style="border:none;border-top:1px solid #eee;margin:16px 0">'
        f'<p style="margin:0;color:#555">Hi {escape(b["name"])}, your appointment has been cancelled: '
        f'{escape(b["service"])} on {escape(b["date"])} at {escape(b["time"])}. '
        'You can book a new slot anytime from the website. Sorry for the inconvenience.</p>'
        f'<p style="font-size:12px;color:#888;margin-top:16px">Enviado por {escape(EMAIL_FROM_NAME)}.</p>'
        '</td></tr></table>'
    )
    await send_email(to=b["email"], subject=subject, html=html)

# ---------------- Object storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "slayed-joana17"
storage_key = None

def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ---------------- Stripe payments (deposit / señal) ----------------
def configure_stripe() -> None:
    stripe.api_key = os.environ["STRIPE_API_KEY"]


class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str


def stripe_webhook_event(payload: bytes, signature: str | None):
    secret = os.environ["STRIPE_WEBHOOK_SECRET"]
    if not signature:
        raise ValueError("Missing Stripe-Signature header")
    return stripe.Webhook.construct_event(payload, signature, secret)

async def record_earning(booking: Optional[dict], method: str) -> None:
    if not booking:
        return
    await db.earnings.update_one(
        {"booking_id": booking["id"]},
        {"$setOnInsert": {
            "id": str(uuid.uuid4()), "booking_id": booking["id"],
            "amount": float(booking.get("deposit_amount") or booking.get("total_amount") or DEFAULT_DEPOSIT),
            "method": method, "service": booking.get("service", ""),
            "client": booking.get("name", ""), "booking_date": booking.get("date", ""),
            "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True)

async def mark_paid(session_id: str, payment_intent=None):
    res = await db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid",
                  "stripe_payment_intent_id": payment_intent,
                  "updated_at": datetime.now(timezone.utc).isoformat()}})
    if res.modified_count:
        tx = await db.payment_transactions.find_one({"session_id": session_id})
        if tx and tx.get("booking_id"):
            await db.bookings.update_one({"id": tx["booking_id"]},
                                         {"$set": {"payment_status": "paid"}})
            booking = await db.bookings.find_one({"id": tx["booking_id"]}, {"_id": 0})
            if booking:
                await record_earning(booking, "online")
                await notify_owner_booking({**booking, "payment_method": "online"})

@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest, request: Request):
    booking = await db.bookings.find_one({"id": req.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Esta reserva ya tiene la señal pagada")
    if booking.get("payment_method") != "online":
        raise HTTPException(status_code=400, detail="Esta reserva no usa pago con tarjeta")
    total = float(booking.get("total_amount") or booking.get("deposit_amount") or DEFAULT_DEPOSIT)
    deposit = float(booking.get("deposit_amount") or round(total / 2, 2))
    configure_stripe()
    try:
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": f"Señal de reserva - {booking.get('service', 'Servicio')}",
                                      "description": "Depósito del 50 % de la reserva"},
                    "unit_amount": int(round(deposit * 100)),
                },
                "quantity": 1,
            }],
            success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{req.origin_url}/payment/cancel?booking_id={req.booking_id}",
            metadata={
                "booking_id": req.booking_id,
                "type": "deposit_payment",
                "service": booking.get("service", ""),
            },
        )
    except Exception as exc:
        logger.error("Stripe checkout failed for booking %s: %s", req.booking_id, exc)
        raise HTTPException(status_code=502, detail="No se pudo iniciar el pago con tarjeta")
    await db.payment_transactions.insert_one({
        "session_id": session.id, "booking_id": req.booking_id, "lookup_key": "deposit_payment",
        "amount": deposit, "currency": "eur",
        "status": "initiated", "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.bookings.update_one({"id": req.booking_id},
                                 {"$set": {"payment_session_id": session.id}})
    return {"checkout_url": session.url, "session_id": session.id}

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if record.get("payment_status") != "paid":
        try:
            configure_stripe()
            status = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)
            if status.payment_status == "paid" or status.status == "complete":
                await mark_paid(session_id, getattr(status, "payment_intent", None))
                record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except Exception as exc:
            logger.warning("Stripe status check failed for %s: %s", session_id, exc)
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"]}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("Stripe-Signature")
    try:
        event = stripe_webhook_event(payload, signature)
    except Exception as exc:
        logger.warning("Stripe webhook rejected: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid signature")
    event_type = event.get("type")
    session = event.get("data", {}).get("object", {})
    event_session_id = session.get("id")
    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        await mark_paid(event_session_id, session.get("payment_intent"))
    elif event_type == "checkout.session.async_payment_failed":
        await db.payment_transactions.update_one(
            {"session_id": event_session_id},
            {"$set": {"status": "failed", "payment_status": "failed",
                      "updated_at": datetime.now(timezone.utc).isoformat()}})
    elif event_type == "checkout.session.expired":
        await db.payment_transactions.update_one(
            {"session_id": event_session_id},
            {"$set": {"status": "expired", "payment_status": "expired",
                      "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "ok"}

# ---------------- Booking schedule ----------------
WEEKDAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

def default_schedule() -> dict:
    return {
        "monday": {"open": True, "start": "14:30", "end": "19:00"},
        "tuesday": {"open": True, "start": "14:30", "end": "19:00"},
        "wednesday": {"open": False, "start": "14:30", "end": "19:00"},
        "thursday": {"open": True, "start": "14:30", "end": "19:00"},
        "friday": {"open": True, "start": "14:30", "end": "19:00"},
        "saturday": {"open": True, "start": "11:00", "end": "18:30"},
        "sunday": {"open": True, "start": "11:00", "end": "18:30"},
    }

def parse_booking_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha no válida")

def parse_slot_time(value: str) -> int:
    try:
        hour, minute = map(int, value.split(":", 1))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Hora no válida")
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise HTTPException(status_code=400, detail="Hora no válida")
    return hour * 60 + minute

def slots_for_day(day_settings: dict, interval_minutes: int) -> list[str]:
    if not day_settings.get("open", False):
        return []
    start = parse_slot_time(day_settings.get("start", ""))
    end = parse_slot_time(day_settings.get("end", ""))
    if start >= end:
        return []
    slots = []
    current = start
    while current < end:
        slots.append(f"{current // 60:02d}:{current % 60:02d}")
        current += interval_minutes
    return slots

def service_duration_minutes(settings: dict, service_key: str, service: str = "") -> int:
    configured = settings.get("service_durations") or {}
    value = configured.get(service_key) or configured.get(service)
    if value is None:
        value = DEFAULT_SERVICE_DURATIONS.get(service_key) or DEFAULT_SERVICE_DURATIONS.get(service) or 60
    try:
        minutes = int(value)
    except (TypeError, ValueError):
        minutes = 60
    return max(10, min(720, minutes))

def booking_duration_minutes(booking: dict, settings: dict) -> int:
    return int(booking.get("duration_minutes") or service_duration_minutes(
        settings, booking.get("service_key") or booking.get("service", ""), booking.get("service", "")
    ))

def fitting_slots(day_settings: dict, slots: list[str], duration_minutes: int) -> list[str]:
    return slots if day_settings.get("open") else []

def slot_overlaps_booking(slot: str, duration_minutes: int, bookings: list[dict], settings: dict) -> bool:
    start = parse_slot_time(slot)
    end = start + duration_minutes
    for booking in bookings:
        try:
            existing_start = parse_slot_time(booking.get("time", ""))
        except HTTPException:
            continue
        existing_end = existing_start + booking_duration_minutes(booking, settings)
        if start < existing_end and existing_start < end:
            return True
    return False

def schedule_for_date(settings: dict, date_value: str):
    booking_day = parse_booking_date(date_value)
    day_key = WEEKDAY_KEYS[booking_day.weekday()]
    day_settings = settings.get("schedule", {}).get(day_key) or default_schedule()[day_key]
    override = (settings.get("date_overrides") or {}).get(date_value)
    if override:
        day_settings = {**day_settings, **override}
    interval = int(settings.get("slot_interval_minutes") or 90)
    return day_settings, slots_for_day(day_settings, interval)


# ---------------- Public API ----------------
@api_router.get("/")
async def root():
    return {"message": "Slayed by Joana17 API"}

class BookingExtraIn(BaseModel):
    id: str
    qty: int = 1

class BookingCreate(BaseModel):
    name: str = ""
    phone: str
    email: Optional[EmailStr] = None
    service: str
    service_key: str = ""
    length: str = ""
    size: str = ""
    extras: list[BookingExtraIn] = []
    date: str
    time: str
    notes: str = ""
    payment_method: str = "bizum"

@api_router.get("/bookings/slots")
async def booked_slots(date: str, service_key: str = "", service: str = ""):
    settings = await get_settings()
    day_settings, all_slots = schedule_for_date(settings, date)
    duration = service_duration_minutes(settings, service_key, service)
    slots = fitting_slots(day_settings, all_slots, duration)
    docs = await db.bookings.find(
        {"date": date, "status": {"$ne": "cancelled"}},
        {"_id": 0, "time": 1, "service": 1, "service_key": 1, "duration_minutes": 1},
    ).to_list(200)
    taken = sorted({d["time"] for d in docs if d.get("time")} | {
        slot for slot in slots if slot_overlaps_booking(slot, duration, docs, settings)
    })
    capacity = int(settings.get("daily_capacity") or 2)
    remaining_capacity = max(capacity - len(docs), 0) if day_settings.get("open") else 0
    available = [slot for slot in slots if slot not in taken] if remaining_capacity > 0 else []
    return {
        "date": date,
        "slots": slots,
        "taken": taken,
        "available": available,
        "is_open": bool(day_settings.get("open")),
        "daily_capacity": capacity,
        "bookings_count": len(docs),
        "remaining_capacity": remaining_capacity,
        "duration_minutes": duration,
    }

@api_router.get("/bookings/calendar")
async def booking_calendar(start: str, end: str, service_key: str = "", service: str = ""):
    start_date = parse_booking_date(start)
    end_date = parse_booking_date(end)
    if end_date < start_date or (end_date - start_date).days > 92:
        raise HTTPException(status_code=400, detail="El rango debe tener entre 0 y 92 días")
    settings = await get_settings()
    duration = service_duration_minutes(settings, service_key, service)
    date_list = [(start_date + timedelta(days=offset)).isoformat()
                 for offset in range((end_date - start_date).days + 1)]
    day_info = {}
    for date_value in date_list:
        day_settings, all_slots = schedule_for_date(settings, date_value)
        available_slots = fitting_slots(day_settings, all_slots, duration)
        day_info[date_value] = (day_settings, available_slots)
    docs = await db.bookings.find(
        {"date": {"$in": date_list}, "status": {"$ne": "cancelled"}},
        {"_id": 0, "date": 1, "time": 1, "service": 1, "service_key": 1, "duration_minutes": 1},
    ).to_list(200)
    docs_by_date: dict[str, list] = {}
    for d in docs:
        dv = d.get("date")
        if dv:
            docs_by_date.setdefault(dv, []).append(d)
    capacity = int(settings.get("daily_capacity") or 2)
    dates = {}
    for date_value in date_list:
        day_settings, available_slots = day_info[date_value]
        daily_docs = docs_by_date.get(date_value, [])
        taken = {slot for slot in available_slots if slot_overlaps_booking(slot, duration, daily_docs, settings)}
        dates[date_value] = {
            "open": bool(day_settings.get("open")) and bool(available_slots),
            "full": bool(day_settings.get("open")) and (len(daily_docs) >= capacity or len(available_slots) == len(taken)),
            "available_slots": max(len(available_slots) - len(taken), 0),
            "bookings_count": len(daily_docs),
        }
    return {"start": start, "end": end, "dates": dates, "duration_minutes": duration}

@api_router.post("/bookings")
async def create_booking(payload: BookingCreate, request: Request):
    try:
        user = await get_google_user(request)
    except HTTPException:
        user = None
    if not user and not payload.name.strip():
        raise HTTPException(status_code=400, detail="Indica tu nombre")
    if payload.payment_method not in ("online", "bizum"):
        raise HTTPException(status_code=400, detail="Método de pago no válido")
    settings = await get_settings()
    duration = service_duration_minutes(settings, payload.service_key or payload.service, payload.service)
    day_settings, all_slots = schedule_for_date(settings, payload.date)
    allowed_slots = fitting_slots(day_settings, all_slots, duration)
    if not day_settings.get("open") or not allowed_slots:
        raise HTTPException(status_code=400, detail="Este día no está disponible para reservas")
    if payload.time not in allowed_slots:
        raise HTTPException(status_code=400, detail="Esa hora no está disponible para el día elegido")
    daily_docs = await db.bookings.find(
        {"date": payload.date, "status": {"$ne": "cancelled"}},
        {"_id": 0, "time": 1, "service": 1, "service_key": 1, "duration_minutes": 1},
    ).to_list(200)
    if len(daily_docs) >= int(settings.get("daily_capacity") or 2):
        raise HTTPException(status_code=409, detail="Este día ya está completo. Elige otra fecha.")
    if slot_overlaps_booking(payload.time, duration, daily_docs, settings):
        raise HTTPException(status_code=409, detail="Esa hora se solapa con otra cita. Elige otra.")
    total = compute_total(
        payload.service_key or payload.service,
        payload.length,
        payload.size,
        payload.extras,
        settings.get("price_book"),
        settings.get("extras_prices"),
    )
    if total <= 0:
        raise HTTPException(status_code=400, detail="Servicio no válido")
    deposit = round(total / 2, 2)
    remaining = round(total - deposit, 2)
    variant_label = " · ".join(x for x in [payload.length, payload.size] if x)
    extras_detail = []
    for extra_id, qty in normalized_extras(payload.extras):
        name, default_price = EXTRAS_BOOK[extra_id]
        price = float((settings.get("extras_prices") or {}).get(extra_id, default_price))
        amount = price * qty
        extras_detail.append(f"{name}{f' x{qty}' if qty > 1 else ''} (+{money_label(amount)}€)")
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(),
           "name": user.get("name", "") if user else payload.name.strip(),
           "email": (user.get("email", "") if user else (payload.email or "")) or "",
           "user_id": user.get("user_id", "") if user else "",
           "variant_label": variant_label,
           "extras_detail": extras_detail,
           "total_amount": total,
           "deposit_amount": deposit,
           "remaining_amount": remaining,
           "duration_minutes": duration,
           "payment_status": "pending" if payload.payment_method == "online" else "bizum_pending",
           "status": "pending",
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.bookings.insert_one(dict(doc))
    notified = await notify_owner_booking(doc)
    return {"ok": True, "id": doc["id"], "notified": notified, "total": total, "deposit": deposit, "remaining": remaining, "duration_minutes": duration}

@api_router.get("/my-bookings")
async def my_bookings(request: Request):
    user = await get_google_user(request)
    return await db.bookings.find(
        {"$or": [{"user_id": user.get("user_id")}, {"email": user.get("email")}]},
        {"_id": 0}).sort("date", 1).to_list(200)

@api_router.get("/bookings")
async def list_bookings(user=Depends(get_admin_user)):
    documents = await db.bookings.find({}).sort("created_at", -1).to_list(500)
    result = []
    for booking in documents:
        mongo_id = booking.pop("_id", None)
        if not booking.get("id") and mongo_id is not None:
            booking["id"] = str(mongo_id)
        result.append(booking)
    return result

class BookingStatus(BaseModel):
    status: str

def booking_identity_filter(booking_id: str) -> dict:
    filters = [{"id": booking_id}]
    if ObjectId.is_valid(booking_id):
        filters.append({"_id": ObjectId(booking_id)})
    return {"$or": filters}

@api_router.patch("/bookings/{booking_id}")
async def update_booking(booking_id: str, payload: BookingStatus, user=Depends(get_admin_user)):
    if payload.status not in ("pending", "confirmed", "cancelled"):
        raise HTTPException(status_code=400, detail="Estado no válido")
    identity = booking_identity_filter(booking_id)
    res = await db.bookings.update_one(identity, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    client_notified = False
    if payload.status in ("confirmed", "cancelled"):
        booking = await db.bookings.find_one(identity, {"_id": 0})
        if booking and booking.get("email"):
            try:
                if payload.status == "confirmed":
                    await send_confirmation_email(booking)
                else:
                    await send_cancellation_email(booking)

                client_notified = True
            except Exception as e:
                logger.error("Status email failed for booking %s: %s", booking_id, e)
    if payload.status == "cancelled":
        await notify_waitlist_opening(booking.get("date", ""), booking.get("time", ""))
    return {"ok": True, "client_notified": client_notified}

class WaitlistCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    service: str
    service_key: str = ""
    date: str

@api_router.post("/waitlist")
async def join_waitlist(payload: WaitlistCreate):
    if not payload.name.strip() or not payload.phone.strip():
        raise HTTPException(status_code=400, detail="Indica nombre y teléfono")
    settings = await get_settings()
    duration = service_duration_minutes(settings, payload.service_key or payload.service, payload.service)
    day_settings, all_slots = schedule_for_date(settings, payload.date)
    slots = fitting_slots(day_settings, all_slots, duration)
    if not day_settings.get("open"):
        raise HTTPException(status_code=400, detail="Este día el estudio está cerrado")
    docs = await db.bookings.find(
        {"date": payload.date, "status": {"$ne": "cancelled"}},
        {"_id": 0, "time": 1, "service": 1, "service_key": 1, "duration_minutes": 1},
    ).to_list(200)
    capacity = int(settings.get("daily_capacity") or 2)
    available = [slot for slot in slots if not slot_overlaps_booking(slot, duration, docs, settings)]
    if len(docs) < capacity and available:
        raise HTTPException(status_code=400, detail="Todavía hay huecos disponibles para este día")
    existing = await db.waitlist.find_one({
        "date": payload.date,
        "phone": payload.phone.strip(),
        "service_key": payload.service_key or payload.service,
        "status": {"$in": ["waiting", "notified"]},
    })
    if existing:
        return {"ok": True, "id": existing["id"], "already": True}
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "phone": payload.phone.strip(),
        "email": str(payload.email or ""),
        "service": payload.service,
        "service_key": payload.service_key or payload.service,
        "date": payload.date,
        "status": "waiting",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "notified_at": "",
    }
    await db.waitlist.insert_one(dict(doc))
    return {"ok": True, "id": doc["id"], "already": False}

def email_shell(title: str, content: str) -> str:
    return (
        '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#1a1a1a">'
        f'<h2 style="margin:0 0 12px">{escape(title)}</h2>{content}'
        f'<p style="font-size:12px;color:#888;margin-top:16px">Enviado por {escape(EMAIL_FROM_NAME)}.</p>'
        '</td></tr></table>'
    )

def btn(url: str, label: str) -> str:
    return (
        f'<a href="{escape(url)}" style="display:inline-block;background:#F7A8C9;color:#fff;'
        f'padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">{escape(label)}</a>'
    )

def waitlist_email_html(entry: dict, date: str, time: str) -> str:
    content = (
        f'<p style="margin:0 0 14px;line-height:1.6;">Hola {escape(entry.get("name", ""))}, se ha liberado un hueco el '
        f'<strong>{escape(date)}</strong> a las <strong>{escape(time)}</strong> para '
        f'<strong>{escape(entry.get("service", ""))}</strong>.</p>'
        '<p style="margin:0 0 18px;color:#777;line-height:1.6;">Entra cuanto antes para reservarlo; las plazas se asignan por orden de llegada.</p>'
        f'{btn(SITE_URL + "/#reservar", "Reservar ahora")}'
    )
    return email_shell("Hueco disponible — Slayed by Joana17", content)

async def notify_waitlist_opening(date: str, time: str):
    entries = await db.waitlist.find({"date": date, "status": "waiting"}, {"_id": 0}).sort("created_at", 1).to_list(10)
    if not entries:
        return
    settings = await get_settings()
    owner = (settings.get("owner_notify_email") or OWNER_NOTIFY_EMAIL).strip()
    rows = "".join(
        f"<li>{escape(e.get('name', ''))} · {escape(e.get('phone', ''))} · {escape(e.get('service', ''))}{' · ' + escape(e.get('email', '')) if e.get('email') else ''}</li>"
        for e in entries
    )
    try:
        await send_email(
            to=owner,
            subject=f"Lista de espera: hueco libre {date} {time}",
            html=email_shell("Hueco liberado", f"<h2>Se ha liberado un hueco</h2><p>{date} a las {time}.</p><ul>{rows}</ul>"),
        )
    except Exception as exc:
        logger.error("Waitlist owner notification failed: %s", exc)
    for entry in entries:
        if not entry.get("email"):
            continue
        try:
            await send_email(to=entry["email"], subject="Se ha liberado un hueco para tu cita", html=waitlist_email_html(entry, date, time))
            await db.waitlist.update_one(
                {"id": entry["id"]},
                {"$set": {"status": "notified", "notified_at": datetime.now(timezone.utc).isoformat()}},
            )
        except Exception as exc:
            logger.error("Waitlist client notification failed for %s: %s", entry.get("id"), exc)

class WaitlistPatch(BaseModel):
    status: str

@api_router.get("/admin/waitlist")
async def admin_waitlist(user=Depends(get_admin_user)):
    docs = await db.waitlist.find(
        {"status": {"$in": ["waiting", "notified", "contacted"]}},
        {"_id": 0},
    ).sort([("date", 1), ("created_at", 1)]).to_list(500)
    return docs

@api_router.patch("/admin/waitlist/{entry_id}")
async def update_waitlist(entry_id: str, payload: WaitlistPatch, user=Depends(get_admin_user)):
    if payload.status not in ("waiting", "notified", "contacted"):
        raise HTTPException(status_code=400, detail="Estado no válido")
    res = await db.waitlist.update_one({"id": entry_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    return {"ok": True}

@api_router.delete("/admin/waitlist/{entry_id}")
async def delete_waitlist(entry_id: str, user=Depends(get_admin_user)):
    res = await db.waitlist.delete_one({"id": entry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    return {"ok": True}


class BookingPaymentPatch(BaseModel):
    payment_status: str

@api_router.patch("/bookings/{booking_id}/payment")
async def update_booking_payment(booking_id: str, payload: BookingPaymentPatch, user=Depends(get_admin_user)):
    if payload.payment_status not in ("pending", "paid", "bizum_pending", "cash_on_site"):
        raise HTTPException(status_code=400, detail="Estado de pago no válido")
    identity = booking_identity_filter(booking_id)
    res = await db.bookings.update_one(identity, {"$set": {"payment_status": payload.payment_status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if payload.payment_status == "paid":
        booking = await db.bookings.find_one(identity, {"_id": 0})
        if booking and not booking.get("id"):
            booking["id"] = booking_id
        await record_earning(booking, (booking or {}).get("payment_method", "bizum"))
    return {"ok": True}

@api_router.delete("/bookings/{booking_id}")
async def delete_cancelled_booking(booking_id: str, user=Depends(get_admin_user)):
    identity = booking_identity_filter(booking_id)
    booking = await db.bookings.find_one(identity, {"_id": 0, "id": 1, "status": 1})
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if booking.get("status") != "cancelled":
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar reservas canceladas")
    result = await db.bookings.delete_one(identity)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return {"ok": True}

@api_router.get("/config")
async def public_config():
    settings = await get_settings()
    return {
        "bizum_number": (settings.get("bizum_number") or os.environ.get("BIZUM_NUMBER", "")).strip(),
        "instagram": settings.get("instagram") or "https://www.instagram.com/slayedbyjoana17/",
        "studio_address": settings.get("studio_address") or "Barinaga 6, bajo derecha, Bilbao",
        "daily_capacity": settings.get("daily_capacity", 2),
        "slot_interval_minutes": settings.get("slot_interval_minutes", 90),
        "schedule": settings.get("schedule") or default_schedule(),
        "date_overrides": settings.get("date_overrides") or {},
        "service_durations": settings.get("service_durations") or DEFAULT_SERVICE_DURATIONS,
        "price_book": settings.get("price_book") or PRICE_BOOK,
        "extras_prices": settings.get("extras_prices") or default_extras_prices(),
        "service_overrides": settings.get("service_overrides") or {},
        "custom_services": settings.get("custom_services") or [],
        "site_content": settings.get("site_content") or {"es": {}, "en": {}},
        "promo": settings.get("promo") or {"enabled": False, "text_es": "", "text_en": ""},
        "theme": settings.get("theme") or DEFAULT_THEME,
    }

# ---------------- Ajustes del sitio y administradoras ----------------
_settings_cache: dict | None = None
_settings_lock = asyncio.Lock()

def _invalidate_settings_cache():
    global _settings_cache
    _settings_cache = None

async def get_settings() -> dict:
    global _settings_cache
    async with _settings_lock:
        if _settings_cache is not None:
            return _settings_cache
    defaults = {
        "id": "site",
        "owner_notify_email": OWNER_NOTIFY_EMAIL,
        "bizum_number": os.environ.get("BIZUM_NUMBER", "").strip(),
        "instagram": "https://www.instagram.com/slayedbyjoana17/",
        "studio_address": "Barinaga 6, bajo derecha, Bilbao",
        "daily_capacity": 2,
        "slot_interval_minutes": 90,
        "schedule": default_schedule(),
        "date_overrides": {},
        "service_durations": dict(DEFAULT_SERVICE_DURATIONS),
        "price_book": deepcopy(PRICE_BOOK),
        "extras_prices": default_extras_prices(),
        "service_overrides": {},
        "custom_services": [],
        "site_content": {"es": {}, "en": {}},
        "promo": {"enabled": False, "text_es": "", "text_en": ""},
        "theme": dict(DEFAULT_THEME),
    }
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    if not doc:
        await db.settings.insert_one(deepcopy(defaults))
        return defaults
    merged = {**defaults, **doc}
    schedule = default_schedule()
    for day, value in (doc.get("schedule") or {}).items():
        if day in schedule:
            schedule[day].update(value)
    merged["schedule"] = schedule
    merged["date_overrides"] = {}
    for date_key, value in (doc.get("date_overrides") or {}).items():
        try:
            parse_booking_date(date_key)
            if not isinstance(value, dict):
                continue
            override = {"open": bool(value.get("open", False))}
            if override["open"]:
                override["start"] = value.get("start", "09:00")
                override["end"] = value.get("end", "18:00")
                if parse_slot_time(override["start"]) >= parse_slot_time(override["end"]):
                    continue
            merged["date_overrides"][date_key] = override
        except (ValueError, TypeError, HTTPException):
            continue
    durations = dict(DEFAULT_SERVICE_DURATIONS)
    durations.update(doc.get("service_durations") or {})
    merged["service_durations"] = durations
    merged["price_book"] = merge_dict_deep(PRICE_BOOK, doc.get("price_book") or {})
    extras_prices = default_extras_prices()
    extras_prices.update(doc.get("extras_prices") or {})
    merged["extras_prices"] = extras_prices
    merged["service_overrides"] = doc.get("service_overrides") or {}
    merged["custom_services"] = doc.get("custom_services") or []
    merged["site_content"] = {
        "es": doc.get("site_content", {}).get("es", {}),
        "en": doc.get("site_content", {}).get("en", {}),
    }
    merged["promo"] = {**defaults["promo"], **(doc.get("promo") or {})}
    merged["theme"] = {**DEFAULT_THEME, **(doc.get("theme") or {})}
    async with _settings_lock:
        _settings_cache = merged
    return merged

@api_router.get("/admin/settings")
async def admin_get_settings(user=Depends(get_admin_user)):
    return await get_settings()

class DayScheduleIn(BaseModel):
    open: bool
    start: str
    end: str

class ServiceOverrideIn(BaseModel):
    name: str = ""
    descEs: str = ""
    descEn: str = ""
    visible: bool = True
    order: int = 0

class PromoIn(BaseModel):
    enabled: bool = False
    text_es: str = ""
    text_en: str = ""

class CustomServiceOptionIn(BaseModel):
    label: str
    price: float

class CustomServiceIn(BaseModel):
    id: str
    key: str
    category: str
    name: str
    type: str = "simple"
    base: float = 0
    options: list[CustomServiceOptionIn] = Field(default_factory=list)
    duration_minutes: int = 60
    descEs: str = ""
    descEn: str = ""
    extras: list[str] = Field(default_factory=list)
    visible: bool = True
    order: int = 100

class SettingsIn(BaseModel):
    owner_notify_email: str = ""
    bizum_number: str = ""
    instagram: str = ""
    studio_address: str = "Barinaga 6, bajo derecha, Bilbao"
    daily_capacity: int = 2
    slot_interval_minutes: int = 90
    schedule: dict[str, DayScheduleIn] = Field(default_factory=dict)
    date_overrides: dict[str, dict[str, Any]] = Field(default_factory=dict)
    service_durations: dict[str, int] = Field(default_factory=dict)
    price_book: dict[str, Any] = Field(default_factory=dict)
    extras_prices: dict[str, float] = Field(default_factory=dict)
    service_overrides: dict[str, ServiceOverrideIn] = Field(default_factory=dict)
    custom_services: list[CustomServiceIn] = Field(default_factory=list)
    site_content: dict[str, dict[str, Any]] = Field(default_factory=dict)
    promo: PromoIn = Field(default_factory=PromoIn)
    theme: dict[str, str] = Field(default_factory=dict)

@api_router.put("/admin/settings")
async def admin_put_settings(payload: SettingsIn, user=Depends(get_admin_user)):
    if not 1 <= payload.daily_capacity <= 20:
        raise HTTPException(status_code=400, detail="El límite diario debe estar entre 1 y 20")
    if not 30 <= payload.slot_interval_minutes <= 240:
        raise HTTPException(status_code=400, detail="El intervalo debe estar entre 30 y 240 minutos")
    schedule = default_schedule()
    for day, day_settings in payload.schedule.items():
        if day not in WEEKDAY_KEYS:
            continue
        data = day_settings.model_dump()
        start = parse_slot_time(data["start"])
        end = parse_slot_time(data["end"])
        if data["open"] and start >= end:
            raise HTTPException(status_code=400, detail=f"El horario de {day} debe tener inicio anterior al cierre")
        schedule[day] = data
    date_overrides = {}
    for date_key, override in payload.date_overrides.items():
        try:
            parse_booking_date(date_key)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"La fecha {date_key} no es válida; usa AAAA-MM-DD")
        if not isinstance(override, dict):
            continue
        is_open = bool(override.get("open", False))
        normalized = {"open": is_open}
        if is_open:
            normalized["start"] = str(override.get("start", "09:00"))
            normalized["end"] = str(override.get("end", "18:00"))
            if parse_slot_time(normalized["start"]) >= parse_slot_time(normalized["end"]):
                raise HTTPException(status_code=400, detail=f"El horario especial de {date_key} no es válido")
        date_overrides[date_key] = normalized
    durations = dict(DEFAULT_SERVICE_DURATIONS)
    for service_key, minutes in payload.service_durations.items():
        if service_key not in DEFAULT_SERVICE_DURATIONS:
            continue
        if not 10 <= minutes <= 720:
            raise HTTPException(status_code=400, detail=f"La duración de {service_key} debe estar entre 10 y 720 minutos")
        durations[service_key] = minutes
    price_book = merge_dict_deep(PRICE_BOOK, payload.price_book)
    validate_price_tree(price_book, "price_book")
    extras_prices = default_extras_prices()
    for extra_id, price in payload.extras_prices.items():
        if extra_id not in EXTRAS_BOOK:
            continue
        if not 0 <= price <= 1000:
            raise HTTPException(status_code=400, detail=f"El precio de {extra_id} debe estar entre 0 y 1000")
        extras_prices[extra_id] = float(price)
    for key in list(price_book.keys()):
        if key.startswith("custom_"):
            del price_book[key]
    for key in list(durations.keys()):
        if key.startswith("custom_"):
            del durations[key]
    custom_services = []
    seen_custom_keys = set()
    for service in payload.custom_services:
        data = service.model_dump()
        key = data["key"].strip()
        if not key.startswith("custom_") or key in seen_custom_keys:
            raise HTTPException(status_code=400, detail="Cada servicio personalizado necesita una clave única")
        if data["category"] not in ("mujer", "hombre", "extras"):
            raise HTTPException(status_code=400, detail="Categoría de servicio no válida")
        if data["type"] not in ("simple", "options"):
            raise HTTPException(status_code=400, detail="Tipo de precio no válido")
        if not data["name"].strip():
            raise HTTPException(status_code=400, detail="El servicio personalizado necesita nombre")
        if not 0 <= float(data["base"]) <= 1000:
            raise HTTPException(status_code=400, detail=f"El precio de {data['name']} debe estar entre 0 y 1000")
        if not 10 <= int(data["duration_minutes"]) <= 720:
            raise HTTPException(status_code=400, detail=f"La duración de {data['name']} debe estar entre 10 y 720 minutos")
        invalid_extras = [extra_id for extra_id in data["extras"] if extra_id not in EXTRAS_BOOK]
        if invalid_extras:
            raise HTTPException(status_code=400, detail=f"Extras no válidos: {', '.join(invalid_extras)}")
        if data["type"] == "options":
            if not data["options"]:
                raise HTTPException(status_code=400, detail=f"{data['name']} necesita al menos una opción")
            labels = set()
            for option in data["options"]:
                label = option["label"].strip()
                if not label or label in labels:
                    raise HTTPException(status_code=400, detail=f"Opciones repetidas o vacías en {data['name']}")
                if not 0 <= float(option["price"]) <= 1000:
                    raise HTTPException(status_code=400, detail=f"El precio de {label} debe estar entre 0 y 1000")
                labels.add(label)
            price_book[key] = {"options": {option["label"].strip(): float(option["price"]) for option in data["options"]},
                               "base": float(data["base"])}
        else:
            price_book[key] = {"base": float(data["base"])}
        durations[key] = int(data["duration_minutes"])
        data["key"] = key
        data["name"] = data["name"].strip()
        custom_services.append(data)
        seen_custom_keys.add(key)
    if len(payload.promo.text_es) > 240 or len(payload.promo.text_en) > 240:
        raise HTTPException(status_code=400, detail="El aviso promocional no puede superar 240 caracteres")
    theme = dict(DEFAULT_THEME)
    for key, value in payload.theme.items():
        if key not in DEFAULT_THEME:
            continue
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", value or ""):
            raise HTTPException(status_code=400, detail=f"El color {key} debe usar formato #RRGGBB")
        theme[key] = value.upper()
    doc = {
        "id": "site",
        **payload.model_dump(exclude={
            "schedule", "date_overrides", "service_durations", "price_book", "extras_prices",
            "service_overrides", "custom_services", "site_content", "promo", "theme",
            "owner_notify_email", "bizum_number", "instagram", "studio_address",
        }),
        "owner_notify_email": payload.owner_notify_email.strip(),
        "bizum_number": payload.bizum_number.strip(),
        "instagram": payload.instagram.strip(),
        "studio_address": payload.studio_address.strip(),
        "schedule": schedule,
        "date_overrides": date_overrides,
        "service_durations": durations,
        "price_book": price_book,
        "extras_prices": extras_prices,
        "service_overrides": {key: value.model_dump() for key, value in payload.service_overrides.items()},
        "custom_services": custom_services,
        "site_content": {
            "es": payload.site_content.get("es", {}),
            "en": payload.site_content.get("en", {}),
        },
        "promo": payload.promo.model_dump(),
        "theme": theme,
    }
    await db.settings.update_one({"id": "site"}, {"$set": doc}, upsert=True)
    _invalidate_settings_cache()
    return {"ok": True}

@api_router.get("/admin/admins")
async def list_admins(user=Depends(get_admin_user)):
    return await db.users.find({"role": "admin"}, {"_id": 0, "password_hash": 0}).to_list(50)

class AdminIn(BaseModel):
    email: EmailStr
    password: str
    name: str = "Admin"

@api_router.post("/admin/admins")
async def add_admin(payload: AdminIn, user=Depends(get_admin_user)):
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        await db.users.update_one({"email": email}, {"$set": {
            "role": "admin", "password_hash": hash_password(payload.password), "name": payload.name}})
    else:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email, "password_hash": hash_password(payload.password),
            "name": payload.name, "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()})
    return {"ok": True}

@api_router.delete("/admin/admins/{email}")
async def remove_admin(email: str, user=Depends(get_admin_user)):
    email = email.lower().strip()
    if email == (os.environ.get("ADMIN_EMAIL") or "").lower():
        raise HTTPException(status_code=400, detail="La cuenta principal no se puede eliminar")
    if email == (user.get("email") or "").lower():
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    if await db.users.count_documents({"role": "admin"}) <= 1:
        raise HTTPException(status_code=400, detail="Debe quedar al menos una administradora")
    res = await db.users.delete_one({"email": email, "role": "admin"})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Administradora no encontrada")
    return {"ok": True}

@api_router.get("/admin/earnings")
async def admin_earnings(user=Depends(get_admin_user)):
    earnings = await db.earnings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    active_items = []
    for earning in earnings:
        booking_id = str(earning.get("booking_id", "")).strip()
        if not booking_id:
            continue
        booking = await db.bookings.find_one(booking_identity_filter(booking_id), {"_id": 0, "id": 1, "status": 1})
        if not booking or booking.get("status") == "cancelled":
            continue
        active_items.append(earning)
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    def total_since(d0) -> float:
        return round(sum(float(i.get("amount", 0)) for i in active_items if str(i.get("created_at", ""))[:10] >= d0.isoformat()), 2)
    return {
        "today": total_since(today),
        "week": total_since(week_start),
        "month": total_since(month_start),
        "total": round(sum(float(i.get("amount", 0)) for i in active_items), 2),
        "count": len(active_items),
        "items": active_items[:50],
    }

@api_router.get("/reviews")
async def list_reviews():
    return await db.reviews.find({"approved": True}, {"_id": 0}).sort("created_at", -1).to_list(100)

class ReviewIn(BaseModel):
    name: str
    service: str = ""
    rating: int = 5
    text_es: str
    text_en: str = ""
    approved: bool = True

@api_router.post("/reviews")
async def submit_review(payload: ReviewIn):
    rating = min(5, max(1, payload.rating))
    doc = {"id": str(uuid.uuid4()), "name": payload.name, "service": payload.service,
           "rating": rating, "text_es": payload.text_es, "text_en": payload.text_en,
           "approved": False, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.reviews.insert_one(dict(doc))
    return {"ok": True, "id": doc["id"]}

class ReviewPatch(BaseModel):
    approved: bool

@api_router.patch("/admin/reviews/{review_id}")
async def toggle_review(review_id: str, payload: ReviewPatch, user=Depends(get_admin_user)):
    res = await db.reviews.update_one({"id": review_id}, {"$set": {"approved": payload.approved}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    return {"ok": True}

@api_router.get("/admin/reviews")
async def admin_list_reviews(user=Depends(get_admin_user)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.post("/admin/reviews")
async def create_review(payload: ReviewIn, user=Depends(get_admin_user)):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.reviews.insert_one(dict(doc))
    return doc

@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, user=Depends(get_admin_user)):
    res = await db.reviews.delete_one({"id": review_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    return {"ok": True}

@api_router.get("/media")
async def list_media():
    items = await db.media.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if it.get("storage_path") and not it.get("url"):
            it["url"] = f"/api/files/{it['storage_path']}"
    return items

ALLOWED_MEDIA = {"image/jpeg", "image/png", "image/webp", "image/gif",
                 "video/mp4", "video/quicktime", "video/webm"}

CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip()
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "").strip()
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "").strip()
CLOUDINARY_ENABLED = all((CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET))
if CLOUDINARY_ENABLED:
    cloudinary.config(cloud_name=CLOUDINARY_CLOUD_NAME, api_key=CLOUDINARY_API_KEY,
                      api_secret=CLOUDINARY_API_SECRET, secure=True)


@api_router.post("/admin/media")
async def upload_media(file: UploadFile = File(...), caption_es: str = Form(""),
                       caption_en: str = Form(""), user=Depends(get_admin_user)):
    ct = file.content_type or "application/octet-stream"
    if ct not in ALLOWED_MEDIA:
        raise HTTPException(status_code=400, detail="Formato no soportado (usa JPG, PNG, WEBP o MP4)")
    data = await file.read()
    if len(data) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx 100MB)")
    if not CLOUDINARY_ENABLED:
        raise HTTPException(status_code=503, detail="Cloudinary no está configurado en Render.")
    resource_type = "video" if ct.startswith("video/") else "image"
    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(data), resource_type=resource_type,
            folder=f"{APP_NAME}/gallery", use_filename=False, unique_filename=True,
        )
    except Exception:
        logger.exception("Cloudinary media upload failed")
        raise HTTPException(status_code=502, detail="Cloudinary no pudo guardar el archivo.")
    public_id = result.get("public_id") if isinstance(result, dict) else None
    url = result.get("secure_url") if isinstance(result, dict) else None
    if not public_id or not url:
        logger.error("Cloudinary response missing public_id or secure_url")
        raise HTTPException(status_code=502, detail="Cloudinary devolvió una respuesta incompleta.")
    doc = {"id": str(uuid.uuid4()), "cloudinary_public_id": public_id,
           "cloudinary_resource_type": resource_type, "url": url,
           "type": "video" if ct.startswith("video") else "image",
           "caption_es": caption_es, "caption_en": caption_en, "content_type": ct,
           "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.media.insert_one(dict(doc))
    return doc

@api_router.delete("/admin/media/{media_id}")
async def delete_media(media_id: str, user=Depends(get_admin_user)):
    record = await db.media.find_one({"id": media_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    if record.get("cloudinary_public_id"):
        try:
            result = cloudinary.uploader.destroy(
                record["cloudinary_public_id"],
                resource_type=record.get("cloudinary_resource_type", "image"),
                invalidate=True,
            )
        except Exception:
            logger.exception("Cloudinary media delete failed")
            raise HTTPException(status_code=502, detail="Cloudinary no pudo eliminar el archivo.")
        if result.get("result") not in ("ok", "not found"):
            raise HTTPException(status_code=502, detail="Cloudinary no confirmó la eliminación.")
    await db.media.update_one({"id": media_id}, {"$set": {"is_deleted": True}})
    return {"ok": True}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.media.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return RawResponse(content=data, media_type=record.get("content_type", content_type))

# ---------------- Seed & startup ----------------
SEED_REVIEWS = [
    {"name": "Ainhoa M.", "service": "Knotless Braids", "rating": 5,
     "text_es": "Buscaba un sitio en Bilbao donde trataran el cabello afro con delicadeza. Las Knotless de Joana me duraron más de un mes impecables y no me dolió nada la cabeza. Repito seguro.",
     "text_en": "I was looking for a place in Bilbao that treated afro hair gently. Joana's Knotless lasted over a month looking flawless and it didn't hurt at all. I'll definitely be back."},
    {"name": "Kevin C.", "service": "Retwist", "rating": 5,
     "text_es": "El mejor Retwist de la ciudad. Joana trabaja súper rápido, con muchísima limpieza y el resultado es de 10. Muy profesional.",
     "text_en": "The best Retwist in town. Joana works super fast, very clean, and the result is a 10. Totally professional."},
    {"name": "Sarah T.", "service": "Fulani Braids", "rating": 5,
     "text_es": "Me hizo unas Fulani con diseño de corazones y quedé encantada. Calidad, buen ambiente y precios súper ajustados.",
     "text_en": "She did my Fulani with a heart design and I loved it. Quality, great vibe and very fair prices."},
]

SEED_MEDIA = [
    {"url": "https://images.unsplash.com/photo-1594254773847-9fce26e950bc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxhZnJvJTIwYnJhaWRzJTIwaGFpcnN0eWxlJTIwa25vdGxlc3MlMjBmdWxhbml8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Knotless Braids", "caption_en": "Knotless Braids"},
    {"url": "https://images.unsplash.com/photo-1592328906746-0a3ca0bde253?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwyfHxhZnJvJTIwYnJhaWRzJTIwaGFpcnN0eWxlJTIwa25vdGxlc3MlMjBmdWxhbml8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Trenzas geométricas", "caption_en": "Geometric braids"},
    {"url": "https://images.unsplash.com/photo-1572955304332-bf714bd49add?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwzfHxhZnJvJTIwYnJhaWRzJTIwaGFpcnN0eWxlJTIwa25vdGxlc3MlMjBmdWxhbml8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Fulani con abalorios", "caption_en": "Fulani with beads"},
    {"url": "https://images.unsplash.com/photo-1663851071150-b6617bbee927?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHw0fHxhZnJvJTIwYnJhaWRzJTIwaGFpcnN0eWxlJTIwa25vdGxlc3MlMjBmdWxhbml8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Detalle Knotless", "caption_en": "Knotless detail"},
    {"url": "https://images.unsplash.com/photo-1640059567558-29deb499a518?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwaGFpciUyMHNhbG9uJTIwc3R5bGlzdCUyMGJyYWlkcyUyMGxvY3N8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Locs naturales", "caption_en": "Natural locs"},
    {"url": "https://images.unsplash.com/photo-1625536658679-42d76fd167c0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHw0fHxhZnJpY2FuJTIwaGFpciUyMHNhbG9uJTIwc3R5bGlzdCUyMGJyYWlkcyUyMGxvY3N8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Locs hombre", "caption_en": "Men's locs"},
    {"url": "https://images.unsplash.com/photo-1640059567352-aa684b7fcc67?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwzfHxhZnJpY2FuJTIwaGFpciUyMHNhbG9uJTIwc3R5bGlzdCUyMGJyYWlkcyUyMGxvY3N8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Retwist de Locs", "caption_en": "Locs retwist"},
    {"url": "https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwzfHxhZnJvJTIwdXJiYW4lMjBmYXNoaW9uJTIwcG9ydHJhaXQlMjBicmFpZHN8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Coleta trenzada", "caption_en": "Braided ponytail"},
    {"url": "https://images.unsplash.com/photo-1673470907547-1c0c6a996095?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHw0fHxhZnJvJTIwdXJiYW4lMjBmYXNoaW9uJTIwcG9ydHJhaXQlMjBicmFpZHN8ZW58MHx8fHwxNzg4ODM3NDE4fDA&ixlib=rb-4.1.0&q=85", "caption_es": "Cornrows urbanos", "caption_en": "Urban cornrows"},
]

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower().strip()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        return
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": admin_email,
                                   "password_hash": hash_password(admin_password),
                                   "name": "Joana", "role": "admin",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})

async def send_appointment_reminders():
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date().isoformat()
    bookings = await db.bookings.find(
        {"date": tomorrow, "status": {"$ne": "cancelled"}, "email": {"$nin": ["", None]},
         "reminder_sent": {"$ne": True}},
        {"_id": 0}).to_list(200)
    for b in bookings:
        subject = f"Recordatorio de tu cita - {b['date']} {b['time']}"
        html = (
            '<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#1a1a1a">'
            f'<h2 style="margin:0 0 12px">Manana es tu cita</h2>'
            f'<p style="margin:0 0 8px">Hola {escape(b["name"])}, te recordamos tu cita en el estudio:</p>'
            f'<p style="margin:0 0 8px"><strong>Servicio:</strong> {escape(b["service"])}<br>'
            f'<strong>Fecha:</strong> {escape(b["date"])}<br>'
            f'<strong>Hora:</strong> {escape(b["time"])}</p>'
            '<p style="margin:0 0 8px">Si no puedes venir, avisanos cuanto antes respondiendo a este correo o por Instagram.</p>'
            '<hr style="border:none;border-top:1px solid #eee;margin:16px 0">'
            f'<p style="margin:0 0 8px;color:#555">Hi {escape(b["name"])}, this is a reminder of your appointment tomorrow: '
            f'{escape(b["service"])} on {escape(b["date"])} at {escape(b["time"])}. '
            'If you cannot make it, please let us know as soon as possible.</p>'
            f'<p style="font-size:12px;color:#888;margin-top:16px">Enviado por {escape(EMAIL_FROM_NAME)}.</p>'
            '</td></tr></table>'
        )
        try:
            await send_email(to=b["email"], subject=subject, html=html)
            await db.bookings.update_one({"id": b["id"]}, {"$set": {"reminder_sent": True}})
            logger.info("Reminder sent for booking %s", b["id"])
        except Exception as e:
            logger.error("Reminder failed for booking %s: %s", b["id"], e)

@app.on_event("startup")
async def startup():
    required = ("MONGO_URL", "DB_NAME", "JWT_SECRET", "FRONTEND_URL", "SITE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD")
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    if await db.reviews.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        await db.reviews.insert_many([
            {"id": str(uuid.uuid4()), **r, "approved": True, "created_at": now} for r in SEED_REVIEWS])
    if await db.media.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        await db.media.insert_many([
            {"id": str(uuid.uuid4()), **m, "type": "image", "is_deleted": False,
             "seeded": True, "created_at": now} for m in SEED_MEDIA])
    if EMERGENT_KEY:
        try:
            init_storage()
            logger.info("Object storage initialized")
        except Exception as e:
            logger.error("Storage init failed: %s", e)
    else:
        logger.info("Object storage disabled: EMERGENT_LLM_KEY is not configured")
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler

        async def cleanup_old_bookings():
            first = datetime.now(timezone.utc).date().replace(day=1).isoformat()
            res = await db.bookings.delete_many({"date": {"$lt": first}})
            if res.deleted_count:
                logger.info("Monthly cleanup removed %s past bookings", res.deleted_count)

        scheduler = AsyncIOScheduler()
        scheduler.add_job(send_appointment_reminders, "interval", hours=1)
        scheduler.add_job(cleanup_old_bookings, "interval", hours=24)
        scheduler.start()
        logger.info("Reminder scheduler started")
    except Exception as e:
        logger.error("Reminder scheduler failed: %s", e)

app.include_router(api_router)

origins = [os.environ["FRONTEND_URL"].rstrip("/")]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
