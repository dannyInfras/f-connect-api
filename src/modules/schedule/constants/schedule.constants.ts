/**
 * Schedule Management Business Rules and Constants
 */

// Time validation constants
export const SCHEDULE_TIME_LIMITS = {
  /** Maximum event duration in milliseconds (8 hours) */
  MAX_EVENT_DURATION: 8 * 60 * 60 * 1000,

  /** Minimum advance notice in milliseconds (30 minutes) */
  MIN_ADVANCE_NOTICE: 30 * 60 * 1000,

  /** Maximum future scheduling in milliseconds (1 year) */
  MAX_FUTURE_SCHEDULING: 365 * 24 * 60 * 60 * 1000,

  /** Buffer time for conflict detection in milliseconds (5 minutes) */
  CONFLICT_BUFFER_TIME: 5 * 60 * 1000,
} as const;

// Participant and content limits
export const SCHEDULE_CONTENT_LIMITS = {
  /** Maximum participants per event */
  MAX_PARTICIPANTS_PER_EVENT: 50,

  /** Maximum event title length */
  MAX_TITLE_LENGTH: 120,

  /** Maximum event notes length */
  MAX_NOTES_LENGTH: 2000,

  /** Maximum location string length */
  MAX_LOCATION_LENGTH: 120,

  /** Minimum participants required */
  MIN_PARTICIPANTS_REQUIRED: 1,
} as const;

// User-friendly error messages
export const SCHEDULE_ERROR_MESSAGES = {
  TIME_VALIDATION: {
    END_BEFORE_START: 'Event end time must be after the start time',
    START_IN_PAST: 'Events cannot be scheduled in the past',
    DURATION_TOO_LONG: `Event duration cannot exceed ${SCHEDULE_TIME_LIMITS.MAX_EVENT_DURATION / (60 * 60 * 1000)} hours`,
    INSUFFICIENT_ADVANCE_NOTICE: `Events must be scheduled at least ${SCHEDULE_TIME_LIMITS.MIN_ADVANCE_NOTICE / (60 * 1000)} minutes in advance`,
    TOO_FAR_IN_FUTURE: `Events cannot be scheduled more than ${SCHEDULE_TIME_LIMITS.MAX_FUTURE_SCHEDULING / (24 * 60 * 60 * 1000)} days in advance`,
  },
  PARTICIPANTS: {
    TOO_MANY: `Maximum ${SCHEDULE_CONTENT_LIMITS.MAX_PARTICIPANTS_PER_EVENT} participants allowed per event`,
    TOO_FEW: `At least ${SCHEDULE_CONTENT_LIMITS.MIN_PARTICIPANTS_REQUIRED} participant is required`,
    INVALID_USER: 'One or more participants are not valid or available',
    DUPLICATE_USER: 'Duplicate participants are not allowed',
  },
  CONTENT: {
    TITLE_TOO_LONG: `Event title cannot exceed ${SCHEDULE_CONTENT_LIMITS.MAX_TITLE_LENGTH} characters`,
    NOTES_TOO_LONG: `Event notes cannot exceed ${SCHEDULE_CONTENT_LIMITS.MAX_NOTES_LENGTH} characters`,
    LOCATION_TOO_LONG: `Event location cannot exceed ${SCHEDULE_CONTENT_LIMITS.MAX_LOCATION_LENGTH} characters`,
    INVALID_CHARACTERS: 'Invalid characters detected in input',
  },
  PERMISSIONS: {
    INSUFFICIENT_CREATE:
      'You do not have permission to create events in this company',
    INSUFFICIENT_UPDATE: 'You do not have permission to update this event',
    INSUFFICIENT_DELETE: 'You do not have permission to cancel this event',
    INSUFFICIENT_VIEW: 'You do not have permission to view this event',
  },
} as const;

// Business rules
export const SCHEDULE_BUSINESS_RULES = {
  /** Default pagination limit */
  DEFAULT_PAGE_LIMIT: 10,

  /** Maximum pagination limit */
  MAX_PAGE_LIMIT: 100,

  /** Default reminder times before event (in minutes) */
  DEFAULT_REMINDER_TIMES: [1440, 60, 15], // 24 hours, 1 hour, 15 minutes

  /** Event statuses that allow updates */
  UPDATABLE_STATUSES: ['pending', 'confirmed'],

  /** Event statuses that allow cancellation */
  CANCELLABLE_STATUSES: ['pending', 'confirmed'],
} as const;
