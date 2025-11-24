/**
 * Data Services
 *
 * Unified data access layer that works across both cloud and Docker deployments.
 */

export { default as dataAccess, getDataAccess, isDockerDeployment, supportsRealTimeSubscriptions } from './DataAccessFactory';
export { default as FirestoreDataAccess } from './FirestoreDataAccess';
export { default as ApiDataAccess } from './ApiDataAccess';
