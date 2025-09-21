import json
import logging
import logging.config
from datetime import datetime
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        payload: Dict[str, Any] = {
            "ts": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        # Añadir campos estándar útiles si existen
        for attr in ("pathname", "lineno", "funcName", "process", "threadName"):
            payload[attr] = getattr(record, attr, None)
        # Si alguien añadió request_id al record
        request_id = getattr(record, "request_id", None)
        if request_id:
            payload["request_id"] = request_id
        return json.dumps(payload, ensure_ascii=False)


def setup_logging(level: str = "INFO", structured: bool = True) -> None:
    """
    Configura logging para la app y para uvicorn.*
    structured=True usa JSON por consola; en caso contrario, formato legible.
    """
    fmt_readable = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    handlers = {
        "console_json": {
            "class": "logging.StreamHandler",
            "level": level,
            "formatter": "json",
        },
        "console_readable": {
            "class": "logging.StreamHandler",
            "level": level,
            "formatter": "readable",
        },
    }

    formatters = {
        "json": {"()": JsonFormatter},
        "readable": {"format": fmt_readable},
    }

    console_handler = "console_json" if structured else "console_readable"

    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": formatters,
        "handlers": handlers,
        "root": {
            "level": level,
            "handlers": [console_handler],
        },
        # Alinear loggers de uvicorn/fastapi
        "loggers": {
            "uvicorn": {"level": level, "handlers": [console_handler], "propagate": False},
            "uvicorn.error": {"level": level, "handlers": [console_handler], "propagate": False},
            "uvicorn.access": {"level": level, "handlers": [console_handler], "propagate": False},
            "fastapi": {"level": level, "handlers": [console_handler], "propagate": False},
        },
    }

    logging.config.dictConfig(config)
