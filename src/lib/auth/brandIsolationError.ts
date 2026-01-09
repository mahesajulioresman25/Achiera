export class BrandIsolationError extends Error {
    constructor(
        message: string,
        public readonly model: string,
        public readonly operation: string
    ) {
        super(message);
        this.name = 'BrandIsolationError';
    }
}
