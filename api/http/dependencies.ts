import useRepositories from '../repositories/useRepositories';
import authCurrentUser from '../router/helpers/authCurrentUser';
import { type RouteDependencies } from './types';

/**
 * Default production wiring of `RouteDependencies`. Resolves the repository
 * layer (idempotent — see `useRepositories`) and binds the real authentication
 * helper. Unit tests bypass this entirely and inject fakes.
 */
export const createRouteDependencies = async (): Promise<RouteDependencies> => {
  const repositories = await useRepositories();
  return {
    repositories,
    // `authCurrentUser` is an overloaded function; the cast selects the broad
    // call signature that matches `RouteDependencies['authenticate']`.
    authenticate: authCurrentUser as RouteDependencies['authenticate'],
  };
};
