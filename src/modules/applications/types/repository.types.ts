// Repository method parameter types
export interface FindByUserIdParams {
  userId: number;
  limit?: number;
  offset?: number;
}

export interface FindByJobIdParams {
  jobId: number;
  limit?: number;
  offset?: number;
}

// Repository query builder types
export interface FindApplicationsQueryOptions {
  limit?: number;
  offset?: number;
  relations?: string[];
  where?: Record<string, any>;
}

// Entity transformation types
export interface CreateApplicationEntityParams {
  jobId: number;
  userId: number;
  cvId?: string;
  coverLetter?: string;
}
