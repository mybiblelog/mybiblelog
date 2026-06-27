import { getConfig } from '../../config';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { InvalidRequestError } from '../errors/http-errors';
import { isSemverLessThan, parseSemver } from '../helpers/semver';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic mobile-app support handler.
 *
 * The React Native app calls this at startup to learn whether the installed
 * version is still supported by the API. When unsupported the client should
 * block usage and prompt the user to upgrade. The `platform`/`version` query
 * params are validated inline (mirroring `getScripturePassage`), and the
 * thresholds come from `config.mobileApp`.
 */

type Platform = 'ios' | 'android';

function isPlatform(value: unknown): value is Platform {
  return value === 'ios' || value === 'android';
}

type AppSupportStatus = {
  platform: Platform;
  current: { version: string };
  minimumSupported: { version: string };
  latest?: { version: string } | null;
  supported: boolean;
  forceUpgrade: boolean;
  storeUrl?: string | null;
};

// GET /mobile-app/support - Report whether the installed app version is supported
export const getMobileAppSupport: RouteHandler = async (req) => {
  const platform = req.query.platform;
  const version = req.query.version;

  if (!isPlatform(platform)) {
    throw new InvalidRequestError([{ field: 'platform', code: ApiErrorDetailCode.NotValid }]);
  }
  if (typeof version !== 'string' || !parseSemver(version)) {
    throw new InvalidRequestError([{ field: 'version', code: ApiErrorDetailCode.NotValid }]);
  }

  const config = getConfig();
  const minVersion = config.mobileApp.minVersion[platform] ?? '0.0.0';
  const latestVersion = config.mobileApp.latestVersion[platform];
  const storeUrl = config.mobileApp.storeUrl[platform];

  const supported = !isSemverLessThan(version, minVersion);
  const status: AppSupportStatus = {
    platform,
    current: { version },
    minimumSupported: { version: minVersion },
    latest: latestVersion ? { version: latestVersion } : null,
    supported,
    forceUpgrade: !supported,
    storeUrl: storeUrl ?? null,
  };

  return { status: 200, body: { data: status } };
};
