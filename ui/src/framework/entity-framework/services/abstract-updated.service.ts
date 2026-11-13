type UpdatedListener = () => void;

/**
 * Mirrors Unity's AbstractUpdatedService — grid state services subscribe and reload.
 */
export class AbstractUpdatedService {
  private listeners = new Set<UpdatedListener>();

  subscribe(listener: UpdatedListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  trigger(): void {
    this.listeners.forEach((listener) => listener());
  }
}
