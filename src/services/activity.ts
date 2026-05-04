import { api } from '@/lib/api-client';

/**
 * Activity action types
 */
export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'INVITE'
  | 'CHANGE';

/**
 * Activity entity types
 */
export type ActivityEntity =
  | 'PARTICIPANT'
  | 'CONTRIBUTION'
  | 'WITHDRAWAL'
  | 'PLAN'
  | 'REPORT'
  | 'USER'
  | 'DOCUMENT'
  | 'INVESTMENT'
  | 'BENEFICIARY'
  | 'PAYROLL'
  | 'COMPLIANCE'
  | 'SETTINGS'
  | 'TENANT';

/**
 * Activity record structure
 */
export interface Activity {
  id: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  userId: string;
  userName?: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Activity input for creating new activities
 */
export interface CreateActivityInput {
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Activity filter parameters
 */
export interface ActivityFilters {
  action?: ActivityAction;
  entity?: ActivityEntity;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Activity service for tracking user actions
 */
export const activityService = {
  /**
   * Track a new activity
   */
  track: async (input: CreateActivityInput): Promise<Activity | null> => {
    try {
      return await api.post<Activity>('/activities', input);
    } catch (error) {
      // Fail silently - don't block user actions due to activity tracking failures
      console.error('Failed to track activity:', error);
      return null;
    }
  },

  /**
   * Get recent activities
   */
  getRecent: async (limit: number = 10): Promise<Activity[]> => {
    return api.get<Activity[]>(`/activities?limit=${limit}&sort=createdAt,desc`);
  },

  /**
   * Get activities with filters
   */
  getFiltered: async (filters: ActivityFilters): Promise<Activity[]> => {
    const params = new URLSearchParams();

    if (filters.action) params.append('action', filters.action);
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    return api.get<Activity[]>(`/activities?${params.toString()}`);
  },

  /**
   * Get activities for a specific entity
   */
  getByEntity: async (entity: ActivityEntity, entityId: string): Promise<Activity[]> => {
    return api.get<Activity[]>(`/activities?entity=${entity}&entityId=${entityId}`);
  },

  /**
   * Get activities for the current user
   */
  getMyActivities: async (limit: number = 20): Promise<Activity[]> => {
    return api.get<Activity[]>(`/activities/me?limit=${limit}`);
  },
};

/**
 * Activity descriptions for common actions
 */
export const activityDescriptions = {
  // Participant actions
  participantCreated: (name: string) => `Added new participant: ${name}`,
  participantUpdated: (name: string) => `Updated participant information: ${name}`,
  participantInvited: (email: string) => `Sent invitation to: ${email}`,
  participantRemoved: (name: string) => `Removed participant: ${name}`,

  // Contribution actions
  contributionUploaded: (filename: string) => `Uploaded payroll file: ${filename}`,
  contributionProcessed: (count: number) => `Processed ${count} contribution records`,
  contributionApproved: (id: string) => `Approved contribution batch: ${id}`,
  contributionRejected: (id: string) => `Rejected contribution batch: ${id}`,

  // Investment actions
  investmentChanged: (name: string) => `Changed investment allocation: ${name}`,
  rebalanceInitiated: () => `Initiated portfolio rebalancing`,

  // Document actions
  documentUploaded: (name: string) => `Uploaded document: ${name}`,
  documentDownloaded: (name: string) => `Downloaded document: ${name}`,
  documentSigned: (name: string) => `Signed document: ${name}`,

  // Report actions
  reportGenerated: (type: string) => `Generated ${type} report`,
  reportExported: (type: string, format: string) => `Exported ${type} report as ${format.toUpperCase()}`,

  // Plan actions
  planUpdated: () => `Updated plan settings`,
  planCreated: (name: string) => `Created new plan: ${name}`,

  // Settings actions
  settingsUpdated: (section: string) => `Updated ${section} settings`,
  passwordChanged: () => `Changed password`,

  // Auth actions
  loginSuccess: () => `Signed in successfully`,
  logoutSuccess: () => `Signed out`,

  // Admin actions
  userImpersonated: (name: string) => `Started impersonating user: ${name}`,
  impersonationEnded: () => `Ended impersonation session`,
  tenantCreated: (name: string) => `Created new tenant: ${name}`,
  tenantUpdated: (name: string) => `Updated tenant: ${name}`,
} as const;
