"""
Configuration module for CV Analysis Worker.
"""

import os
from typing import Optional


class Config:
    """Configuration class for CV Analysis Worker."""
    
    # Database - Individual connection parameters
    DB_HOST: str = os.getenv('DB_HOST', 'localhost')
    DB_PORT: int = int(os.getenv('DB_PORT', '5432'))
    DB_USER: str = os.getenv('DB_USER', '')
    DB_PASS: str = os.getenv('DB_PASS', '')
    DB_NAME: str = os.getenv('DB_NAME', '')
    
    # Perplexity AI
    PERPLEXITY_API_KEY: str = os.getenv('PERPLEXITY_API_KEY', '')
    PERPLEXITY_API_URL: str = os.getenv('PERPLEXITY_API_URL', 'https://api.perplexity.ai/chat/completions')
    PERPLEXITY_MODEL: str = os.getenv('PERPLEXITY_MODEL', 'sonar-pro')
    PERPLEXITY_TIMEOUT: int = int(os.getenv('PERPLEXITY_TIMEOUT', '60'))
    PERPLEXITY_MAX_RETRIES: int = int(os.getenv('PERPLEXITY_MAX_RETRIES', '3'))
    
    # File Download
    DOWNLOAD_TIMEOUT: int = int(os.getenv('DOWNLOAD_TIMEOUT', '30'))
    DOWNLOAD_MAX_RETRIES: int = int(os.getenv('DOWNLOAD_MAX_RETRIES', '3'))
    
    # Retry Configuration
    RETRY_BASE_DELAY: float = float(os.getenv('RETRY_BASE_DELAY', '1.0'))
    RETRY_MAX_DELAY: float = float(os.getenv('RETRY_MAX_DELAY', '60.0'))
    RETRY_MULTIPLIER: float = float(os.getenv('RETRY_MULTIPLIER', '2.0'))
    
    # Worker Configuration
    LISTEN_CHANNEL: str = os.getenv('LISTEN_CHANNEL', 'cv_analysis_channel')
    POLL_INTERVAL: float = float(os.getenv('POLL_INTERVAL', '0.1'))
    SHUTDOWN_TIMEOUT: int = int(os.getenv('SHUTDOWN_TIMEOUT', '30'))
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = os.getenv('LOG_FORMAT', 'json')  # 'json' or 'text'
    
    # Text Processing
    MAX_CV_TEXT_LENGTH: int = int(os.getenv('MAX_CV_TEXT_LENGTH', '10000'))
    
    @classmethod
    def validate(cls) -> None:
        """Validate required configuration values."""
        if not cls.DB_HOST:
            raise ValueError("DB_HOST environment variable is required")
        if not cls.DB_USER:
            raise ValueError("DB_USER environment variable is required")
        if not cls.DB_PASS:
            raise ValueError("DB_PASS environment variable is required")
        if not cls.DB_NAME:
            raise ValueError("DB_NAME environment variable is required")
        if not cls.PERPLEXITY_API_KEY:
            raise ValueError("PERPLEXITY_API_KEY environment variable is required")


# Create a singleton instance
config = Config()
