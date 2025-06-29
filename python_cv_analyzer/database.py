"""
Database operations for CV Analysis Worker.
"""

import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from typing import Dict, Any, Optional, Generator

from config import config
from logger import get_logger

logger = get_logger('database')


class DatabaseError(Exception):
    """Custom exception for database operations."""
    pass


class ConnectionManager:
    """Manages PostgreSQL database connections."""
    
    def __init__(self):
        self.connection_params = {
            'host': config.DB_HOST,
            'port': config.DB_PORT,
            'database': config.DB_NAME,
            'user': config.DB_USER,
            'password': config.DB_PASS
        }
    
    def get_connection(self) -> psycopg2.extensions.connection:
        """Create a new database connection."""
        try:
            conn = psycopg2.connect(**self.connection_params)
            conn.autocommit = False  # Explicit transaction control
            return conn
        except psycopg2.Error as e:
            raise DatabaseError(f"Failed to connect to database: {e}")
    
    @contextmanager
    def get_cursor(self, commit: bool = True) -> Generator[psycopg2.extensions.cursor, None, None]:
        """
        Context manager for database operations with automatic transaction handling.
        
        Args:
            commit: Whether to commit the transaction on success
        """
        conn = None
        cursor = None
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            yield cursor
            
            if commit:
                conn.commit()
                logger.debug("Transaction committed successfully")
                
        except psycopg2.Error as e:
            if conn:
                conn.rollback()
                logger.warning(f"Transaction rolled back due to error: {e}")
            raise DatabaseError(f"Database operation failed: {e}")
        except Exception as e:
            if conn:
                conn.rollback()
                logger.warning(f"Transaction rolled back due to unexpected error: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()


# Global connection manager instance
db_manager = ConnectionManager()


def update_application_status(application_id: int, status: str) -> None:
    """
    Update application status.
    
    Args:
        application_id: ID of the application
        status: New status value
        
    Raises:
        DatabaseError: If update fails
    """
    logger.info(f"Updating application status to {status}")
    
    with db_manager.get_cursor() as cursor:
        cursor.execute(
            "UPDATE job_application SET ai_status = %s WHERE id = %s",
            (status, application_id)
        )
        
        if cursor.rowcount == 0:
            raise DatabaseError(f"Application {application_id} not found")
        
        logger.info(f"Application status updated successfully")


def update_application_with_analysis(
    application_id: int, 
    score: int, 
    analysis: str, 
    status: str = 'COMPLETED'
) -> None:
    """
    Update application with AI analysis results.
    
    Args:
        application_id: ID of the application
        score: AI-generated score (0-100)
        analysis: Analysis text
        status: Final status (default: COMPLETED)
        
    Raises:
        DatabaseError: If update fails
    """
    logger.info(f"Updating application with analysis results")
    
    with db_manager.get_cursor() as cursor:
        cursor.execute("""
            UPDATE job_application 
            SET ai_score = %s, ai_analysis = %s, ai_status = %s 
            WHERE id = %s
        """, (score, analysis, status, application_id))
        
        if cursor.rowcount == 0:
            raise DatabaseError(f"Application {application_id} not found")
        
        logger.info(f"Application updated with analysis results successfully")


def mark_application_failed(application_id: int, error_message: str) -> None:
    """
    Mark application as failed with error message.
    
    Args:
        application_id: ID of the application
        error_message: Error description
        
    Raises:
        DatabaseError: If update fails
    """
    logger.info(f"Marking application as failed")
    
    analysis_text = f"Analysis failed: {error_message}"
    
    with db_manager.get_cursor() as cursor:
        cursor.execute("""
            UPDATE job_application 
            SET ai_score = %s, ai_analysis = %s, ai_status = %s 
            WHERE id = %s
        """, (0, analysis_text, 'FAILED', application_id))
        
        if cursor.rowcount == 0:
            raise DatabaseError(f"Application {application_id} not found")
        
        logger.info(f"Application marked as failed successfully")


def get_application_details(application_id: int) -> Optional[Dict[str, Any]]:
    """
    Get application details including job information.
    
    Args:
        application_id: ID of the application
        
    Returns:
        Application details or None if not found
        
    Raises:
        DatabaseError: If query fails
    """
    logger.debug(f"Fetching application details")
    
    with db_manager.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT 
                ja.id,
                ja.cv_id as cv_url,
                ja.ai_status,
                j.id as job_id,
                j.title,
                j.description,
                j.location,
                j.experience_years,
                c.company_name
            FROM job_application ja
            JOIN job j ON ja.job_id = j.id
            LEFT JOIN company c ON j.company_id = c.id
            WHERE ja.id = %s
        """, (application_id,))
        
        result = cursor.fetchone()
        if not result:
            logger.warning(f"Application {application_id} not found")
            return None
        
        return dict(result)


def check_application_status(application_id: int) -> Optional[str]:
    """
    Check current status of an application.
    
    Args:
        application_id: ID of the application
        
    Returns:
        Current ai_status or None if not found
        
    Raises:
        DatabaseError: If query fails
    """
    with db_manager.get_cursor(commit=False) as cursor:
        cursor.execute(
            "SELECT ai_status FROM job_application WHERE id = %s",
            (application_id,)
        )
        
        result = cursor.fetchone()
        return result['ai_status'] if result else None


def is_application_processed(application_id: int) -> bool:
    """
    Check if an application has already been processed.
    
    Args:
        application_id: ID of the application
        
    Returns:
        True if already processed (has score and analysis)
        
    Raises:
        DatabaseError: If query fails
    """
    with db_manager.get_cursor(commit=False) as cursor:
        cursor.execute("""
            SELECT ai_score, ai_analysis, ai_status 
            FROM job_application 
            WHERE id = %s
        """, (application_id,))
        
        result = cursor.fetchone()
        if not result:
            return False
        
        # Consider processed if has score and analysis, or is in terminal state
        has_results = result['ai_score'] is not None and result['ai_analysis'] is not None
        is_terminal = result['ai_status'] in ('COMPLETED', 'FAILED')
        
        return has_results or is_terminal


def listen_for_notifications(channel: str = None) -> Generator[Dict[str, Any], None, None]:
    """
    Listen for PostgreSQL NOTIFY events.
    
    Args:
        channel: Channel name to listen on
        
    Yields:
        Notification data as dict
        
    Raises:
        DatabaseError: If connection or listening fails
    """
    channel = channel or config.LISTEN_CHANNEL
    conn = None
    
    try:
        conn = db_manager.get_connection()
        conn.autocommit = True  # Required for LISTEN/NOTIFY
        
        cursor = conn.cursor()
        cursor.execute(f"LISTEN {channel}")
        logger.info(f"Listening for notifications on channel: {channel}")
        
        while True:
            # Poll for notifications
            conn.poll()
            
            while conn.notifies:
                notification = conn.notifies.pop(0)
                
                try:
                    # Parse JSON payload
                    import json
                    payload = json.loads(notification.payload)
                    
                    logger.info(
                        f"Received notification",
                        extra={
                            'channel': notification.channel,
                            'pid': notification.pid,
                            'application_id': payload.get('applicationId')
                        }
                    )
                    
                    yield payload
                    
                except (json.JSONDecodeError, KeyError) as e:
                    logger.error(f"Invalid notification payload: {e}")
                    continue
            
            # Short sleep to prevent busy waiting
            import time
            time.sleep(config.POLL_INTERVAL)
            
    except psycopg2.Error as e:
        raise DatabaseError(f"Failed to listen for notifications: {e}")
    except KeyboardInterrupt:
        logger.info("Notification listener interrupted")
        raise
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")
