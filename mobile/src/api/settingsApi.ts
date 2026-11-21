import {
  deleteUserAccount,
  fetchUserSettings,
  patchUserSettings,
  type ServerUserSettings,
} from "@mybiblelog/shared";
import { httpClient } from "@/src/api/httpClient";

export const getSettings = (): Promise<ServerUserSettings> => fetchUserSettings(httpClient);

export const updateSettings = (
  settings: Partial<ServerUserSettings>
): Promise<ServerUserSettings> => patchUserSettings(httpClient, settings);

/** The caller clears the local session afterward (the server also clears the auth cookie). */
export const deleteAccount = (): Promise<void> => deleteUserAccount(httpClient);
