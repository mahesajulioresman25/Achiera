export class BrandIsolationError extends Error {
    public readonly technicalDetails: string;

    constructor(
        message: string,
        public readonly model: string,
        public readonly operation: string
    ) {
        // Show generic message to user, keep technical details for logging
        super('A technical error occurred in data isolation.');
        this.technicalDetails = message;
        this.name = 'BrandIsolationError';
    }
}
