import { BaseProvider } from './BaseProvider';

/**
 * Mock Provider
 * 
 * An in-memory implementation of the BaseProvider interface.
 * Used for "Frontend-Only" mode and demos.
 * 
 * @seam V33-CORE-BP-40
 */
export class MockProvider implements BaseProvider {
    // Scaffold: Implementation logic will go here.
    constructor() {
        console.debug('MockProvider initialized (Scaffold)');
    }
}
