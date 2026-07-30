/** Fields for creating a new record (id must be provided by caller) */
export type CreateInput<T> = Omit<T, 'id'> & { id: string };

/** Fields for updating an existing record (all optional) */
export type UpdateInput<T> = Partial<T>;
