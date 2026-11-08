import { useCallback, useState } from 'react';
import type { RequestStatus, ToolRequest } from '@/lib/domain/models';
import { requests as initialRequests } from '@/mocks/requests';

export function useRequests() {
  const [requests, setRequests] = useState<ToolRequest[]>(() =>
    initialRequests.map((request) => ({ ...request })),
  );

  const updateStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request)),
    );
  }, []);

  const acceptRequest = useCallback((id: string) => updateStatus(id, 'accepted'), [updateStatus]);

  const rejectRequest = useCallback((id: string) => updateStatus(id, 'rejected'), [updateStatus]);

  return { acceptRequest, rejectRequest, requests };
}
