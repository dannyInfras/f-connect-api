"""
Retry utility with exponential backoff.
"""

import asyncio
import functools
import random
import time
from typing import Any, Callable, Optional, Type, Union, Tuple

from config import config
from logger import get_logger

logger = get_logger('retry')


class RetryError(Exception):
    """Exception raised when max retries exceeded."""
    
    def __init__(self, message: str, last_exception: Exception):
        super().__init__(message)
        self.last_exception = last_exception


def exponential_backoff(
    attempt: int,
    base_delay: float = None,
    max_delay: float = None,
    multiplier: float = None,
    jitter: bool = True
) -> float:
    """Calculate exponential backoff delay."""
    base_delay = base_delay or config.RETRY_BASE_DELAY
    max_delay = max_delay or config.RETRY_MAX_DELAY
    multiplier = multiplier or config.RETRY_MULTIPLIER
    
    delay = base_delay * (multiplier ** attempt)
    delay = min(delay, max_delay)
    
    if jitter:
        delay = delay * (0.5 + random.random() * 0.5)
    
    return delay


def retry_on_exception(
    max_retries: int = None,
    exceptions: Union[Type[Exception], Tuple[Type[Exception], ...]] = Exception,
    base_delay: float = None,
    max_delay: float = None,
    multiplier: float = None,
    jitter: bool = True,
    on_retry: Optional[Callable[[Exception, int], None]] = None
):
    """
    Decorator for retrying function calls with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        exceptions: Exception types to catch and retry
        base_delay: Initial delay between retries
        max_delay: Maximum delay between retries
        multiplier: Exponential backoff multiplier
        jitter: Whether to add random jitter to delays
        on_retry: Callback function called on each retry
    """
    max_retries = max_retries or 3
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_retries:
                        logger.error(
                            f"Function {func.__name__} failed after {max_retries} retries",
                            extra={'function': func.__name__, 'attempts': attempt + 1}
                        )
                        raise RetryError(
                            f"Max retries ({max_retries}) exceeded for {func.__name__}",
                            e
                        )
                    
                    delay = exponential_backoff(
                        attempt, base_delay, max_delay, multiplier, jitter
                    )
                    
                    logger.warning(
                        f"Function {func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}), "
                        f"retrying in {delay:.2f}s: {str(e)}",
                        extra={
                            'function': func.__name__,
                            'attempt': attempt + 1,
                            'max_attempts': max_retries + 1,
                            'delay': delay,
                            'error': str(e)
                        }
                    )
                    
                    if on_retry:
                        on_retry(e, attempt)
                    
                    time.sleep(delay)
            
            # This should never be reached
            raise last_exception
        
        return wrapper
    return decorator


class RetryContext:
    """Context manager for retry operations with manual control."""
    
    def __init__(
        self,
        max_retries: int = None,
        base_delay: float = None,
        max_delay: float = None,
        multiplier: float = None,
        jitter: bool = True
    ):
        self.max_retries = max_retries or 3
        self.base_delay = base_delay or config.RETRY_BASE_DELAY
        self.max_delay = max_delay or config.RETRY_MAX_DELAY
        self.multiplier = multiplier or config.RETRY_MULTIPLIER
        self.jitter = jitter
        self.attempt = 0
    
    def should_retry(self, exception: Exception) -> bool:
        """Check if we should retry based on current attempt count."""
        return self.attempt < self.max_retries
    
    def wait(self) -> None:
        """Wait for the calculated backoff delay."""
        if self.attempt > 0:
            delay = exponential_backoff(
                self.attempt - 1, self.base_delay, self.max_delay, 
                self.multiplier, self.jitter
            )
            logger.info(f"Retrying in {delay:.2f}s (attempt {self.attempt + 1}/{self.max_retries + 1})")
            time.sleep(delay)
        
        self.attempt += 1
    
    def reset(self) -> None:
        """Reset attempt counter."""
        self.attempt = 0
