"""Job Wars Multiplayer Server — FastAPI app factory."""
import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import state
from config import get_settings
from database.database import close_db, init_db
from views.stats_view import router as stats_router
from views.websocket_view import router as ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("jobwars")


async def _ping_loop(ping_interval: int) -> None:
    while True:
        await asyncio.sleep(ping_interval)
        msg = json.dumps({"type": "ping", "timestamp": int(time.time() * 1000)})
        dead = set()
        for ws in list(state.all_websockets):
            try:
                await ws.send_text(msg)
            except Exception:
                dead.add(ws)
        state.all_websockets.difference_update(dead)


async def _cleanup_loop(room_expiry: int) -> None:
    while True:
        await asyncio.sleep(300)
        now = time.time()
        expired = [
            code for code, r in state.rooms.items()
            if r.status != "playing" and (now - r.created_at) > room_expiry
        ]
        for code in expired:
            del state.rooms[code]
            log.info(f"🗑️  Expired idle room {code}")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_db()
        log.info(f"🎮 Job Wars server starting on port {settings.PORT}")
        asyncio.create_task(_ping_loop(settings.PING_INTERVAL))
        asyncio.create_task(_cleanup_loop(settings.ROOM_EXPIRY))
        yield
        close_db()

    app = FastAPI(
        title="Job Wars Multiplayer Server",
        lifespan=lifespan,
        docs_url="/docs",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(ws_router)
    app.include_router(stats_router)

    return app


if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:create_app",
        factory=True,
        host="0.0.0.0",
        port=settings.PORT,
        log_level="info",
    )
