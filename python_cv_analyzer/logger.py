"""
Structured logging module for CV Analysis Worker.
"""

import json
import logging
import sys
from contextvars import ContextVar
from typing import Any, Dict, Optional

from config import config

# Context variable for correlation ID
correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
        }
        
        # Add correlation ID if available
        corr_id = correlation_id.get()
        if corr_id:
            log_data['correlation_id'] = corr_id
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)
        
        return json.dumps(log_data)


class TextFormatter(logging.Formatter):
    """Custom text formatter with correlation ID."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as text with correlation ID."""
        corr_id = correlation_id.get()
        if corr_id:
            record.correlation_id = f"[{corr_id}]"
        else:
            record.correlation_id = ""
        
        return super().format(record)


def setup_logging() -> logging.Logger:
    """Set up structured logging for the worker."""
    logger = logging.getLogger('cv_analyzer')
    logger.setLevel(getattr(logging, config.LOG_LEVEL.upper()))
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Set formatter based on configuration
    if config.LOG_FORMAT.lower() == 'json':
        formatter = JSONFormatter()
    else:
        formatter = TextFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(correlation_id)s %(message)s'
        )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(f'cv_analyzer.{name}')


def set_correlation_id(app_id: str) -> None:
    """Set correlation ID for current context."""
    correlation_id.set(f"app_{app_id}")


def clear_correlation_id() -> None:
    """Clear correlation ID from current context."""
    correlation_id.set(None)


def log_with_extra(logger: logging.Logger, level: int, message: str, **extra: Any) -> None:
    """Log message with extra fields."""
    record = logger.makeRecord(
        logger.name, level, "", 0, message, (), None
    )
    record.extra_fields = extra
    logger.handle(record)
