'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  activityService,
  type ActivityAction,
  type ActivityEntity,
} from '@/services/activity';

/**
 * Hook for tracking user activities
 * Provides a simple interface to track actions throughout the application
 *
 * @example
 * ```tsx
 * const { track } = useActivityTracker();
 *
 * // Track a participant creation
 * await createParticipant(data);
 * track('CREATE', 'PARTICIPANT', participant.id, `Added participant ${participant.name}`);
 *
 * // Track a report export
 * await exportReport();
 * track('EXPORT', 'REPORT', reportId, 'Exported contribution report as CSV', { format: 'csv' });
 * ```
 */
export function useActivityTracker() {
  const queryClient = useQueryClient();

  const track = useCallback(
    async (
      action: ActivityAction,
      entity: ActivityEntity,
      entityId: string | undefined,
      description: string,
      metadata?: Record<string, unknown>
    ) => {
      try {
        await activityService.track({
          action,
          entity,
          entityId,
          description,
          metadata,
        });

        // Invalidate activity queries to show new activity immediately
        queryClient.invalidateQueries({ queryKey: ['activities'] });
      } catch (error) {
        // Fail silently - activity tracking should never block user actions
        console.error('Activity tracking failed:', error);
      }
    },
    [queryClient]
  );

  /**
   * Convenience methods for common tracking scenarios
   */
  const trackCreate = useCallback(
    (entity: ActivityEntity, entityId: string, name: string) => {
      return track('CREATE', entity, entityId, `Created ${entity.toLowerCase()}: ${name}`);
    },
    [track]
  );

  const trackUpdate = useCallback(
    (entity: ActivityEntity, entityId: string, name: string) => {
      return track('UPDATE', entity, entityId, `Updated ${entity.toLowerCase()}: ${name}`);
    },
    [track]
  );

  const trackDelete = useCallback(
    (entity: ActivityEntity, entityId: string, name: string) => {
      return track('DELETE', entity, entityId, `Deleted ${entity.toLowerCase()}: ${name}`);
    },
    [track]
  );

  const trackExport = useCallback(
    (entity: ActivityEntity, format: string, description?: string) => {
      return track(
        'EXPORT',
        entity,
        undefined,
        description ?? `Exported ${entity.toLowerCase()} data as ${format.toUpperCase()}`,
        { format }
      );
    },
    [track]
  );

  const trackView = useCallback(
    (entity: ActivityEntity, entityId: string, name: string) => {
      return track('VIEW', entity, entityId, `Viewed ${entity.toLowerCase()}: ${name}`);
    },
    [track]
  );

  return {
    track,
    trackCreate,
    trackUpdate,
    trackDelete,
    trackExport,
    trackView,
  };
}
