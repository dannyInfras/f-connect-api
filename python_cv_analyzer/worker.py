"""
Production-ready CV Analysis Worker.

Listens for PostgreSQL NOTIFY events and processes CV analysis using Perplexity AI.
"""

import json
import signal
import sys
import threading
import time
from typing import Dict, Any, Optional

from config import config
from database import (
    DatabaseError, listen_for_notifications, get_application_details,
    update_application_status, update_application_with_analysis,
    mark_application_failed, is_application_processed
)
from logger import setup_logging, get_logger, set_correlation_id, clear_correlation_id
from utils.extractor import extract_text_from_file
from utils.perplexity import analyze_cv_with_perplexity
from utils.retry import RetryError

# Global shutdown flag
shutdown_event = threading.Event()

# Set up logging
setup_logging()
logger = get_logger('worker')


class CVAnalysisWorker:
    """Main worker class for CV analysis processing."""
    
    def __init__(self):
        self.running = False
        self.current_application_id: Optional[int] = None
    
    def start(self) -> None:
        """Start the worker and begin listening for notifications."""
        logger.info("Starting CV Analysis Worker")
        
        # Validate configuration
        try:
            config.validate()
        except ValueError as e:
            logger.error(f"Configuration validation failed: {e}")
            sys.exit(1)
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGTERM, self._signal_handler)
        signal.signal(signal.SIGINT, self._signal_handler)
        
        self.running = True
        
        try:
            self._listen_and_process()
        except Exception as e:
            logger.error(f"Worker failed with unexpected error: {e}")
            sys.exit(1)
        finally:
            self._cleanup()
    
    def _signal_handler(self, signum: int, frame) -> None:
        """Handle shutdown signals gracefully."""
        signal_name = signal.Signals(signum).name
        logger.info(f"Received {signal_name}, initiating graceful shutdown")
        
        shutdown_event.set()
        self.running = False
        
        # If currently processing, give it time to finish
        if self.current_application_id:
            logger.info(f"Waiting for current application {self.current_application_id} to finish")
            time.sleep(min(config.SHUTDOWN_TIMEOUT, 10))
    
    def _listen_and_process(self) -> None:
        """Main loop: listen for notifications and process them."""
        logger.info("Worker is ready and listening for notifications")
        
        try:
            for notification in listen_for_notifications():
                if shutdown_event.is_set():
                    logger.info("Shutdown requested, stopping notification processing")
                    break
                
                self._process_notification(notification)
                
        except DatabaseError as e:
            logger.error(f"Database connection failed: {e}")
            raise
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
        except Exception as e:
            logger.error(f"Unexpected error in notification loop: {e}")
            raise
    
    def _process_notification(self, notification: Dict[str, Any]) -> None:
        """
        Process a single notification.
        
        Args:
            notification: Notification payload containing applicationId, jobId, cvUrl
        """
        application_id = notification.get('applicationId')
        job_id = notification.get('jobId')
        cv_url = notification.get('cvUrl')
        
        if not all([application_id, job_id, cv_url]):
            logger.error(
                "Invalid notification payload - missing required fields",
                extra={'notification': notification}
            )
            return
        
        # Set correlation ID for logging
        set_correlation_id(str(application_id))
        self.current_application_id = application_id
        
        try:
            logger.info(f"Processing CV analysis", extra={'job_id': job_id})
            
            # Check if application already processed (idempotency)
            if is_application_processed(application_id):
                logger.info("Application already processed, skipping")
                return
            
            # Process the CV analysis
            self._analyze_cv(application_id, cv_url)
            
        except Exception as e:
            logger.error(f"Failed to process notification: {e}")
            # Don't re-raise to continue processing other notifications
        finally:
            self.current_application_id = None
            clear_correlation_id()
    
    def _analyze_cv(self, application_id: int, cv_url: str) -> None:
        """
        Perform complete CV analysis workflow.
        
        Args:
            application_id: ID of the application to analyze
            cv_url: URL of the CV file
        """
        try:
            # Step 1: Update status to PROCESSING (with race condition protection)
            try:
                update_application_status(application_id, 'PROCESSING')
            except DatabaseError as e:
                logger.warning(f"Could not update status to PROCESSING: {e}")
                # Continue anyway - might be a race condition
            
            # Step 2: Get application and job details
            app_details = get_application_details(application_id)
            if not app_details:
                raise ValueError(f"Application {application_id} not found")
            
            logger.info("Retrieved application details", extra={'job_title': app_details.get('title')})
            
            # Step 3: Download and extract CV text
            logger.info("Extracting text from CV")
            cv_text = extract_text_from_file(cv_url)
            
            if not cv_text or len(cv_text.strip()) < 50:
                raise ValueError("CV text is too short or empty after extraction")
            
            logger.info("CV text extracted successfully", extra={'text_length': len(cv_text)})
            
            # Step 4: Analyze CV with Perplexity AI
            logger.info("Starting AI analysis")
            analysis_result = analyze_cv_with_perplexity(cv_text, app_details)
            
            score = analysis_result['score']
            analysis_text = analysis_result['analysis']
            
            logger.info(
                "AI analysis completed successfully",
                extra={'score': score, 'analysis_length': len(analysis_text)}
            )
            
            # Step 5: Update database with results
            update_application_with_analysis(
                application_id, score, analysis_text, 'COMPLETED'
            )
            
            logger.info("CV analysis workflow completed successfully")
            
        except RetryError as e:
            error_msg = f"Failed after retries: {e.last_exception}"
            logger.error(error_msg)
            self._handle_analysis_failure(application_id, error_msg)
            
        except ValueError as e:
            error_msg = f"Validation error: {e}"
            logger.error(error_msg)
            self._handle_analysis_failure(application_id, error_msg)
            
        except DatabaseError as e:
            error_msg = f"Database error: {e}"
            logger.error(error_msg)
            self._handle_analysis_failure(application_id, error_msg)
            
        except Exception as e:
            error_msg = f"Unexpected error: {e}"
            logger.error(error_msg)
            self._handle_analysis_failure(application_id, error_msg)
    
    def _handle_analysis_failure(self, application_id: int, error_message: str) -> None:
        """
        Handle analysis failure by updating database with error status.
        
        Args:
            application_id: ID of the failed application
            error_message: Error description
        """
        try:
            mark_application_failed(application_id, error_message)
            logger.info("Application marked as failed in database")
        except DatabaseError as e:
            logger.error(f"Failed to update application failure status: {e}")
    
    def _cleanup(self) -> None:
        """Cleanup resources on shutdown."""
        logger.info("Worker shutdown complete")


def main() -> None:
    """Main entry point for the worker."""
    worker = CVAnalysisWorker()
    
    try:
        worker.start()
    except KeyboardInterrupt:
        logger.info("Worker interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Worker failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
