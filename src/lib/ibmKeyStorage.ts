// QuIDE — IBM API Key Storage (localStorage BYOK)
// src/lib/ibmKeyStorage.ts

const IBM_KEY_STORAGE = 'quide_ibm_api_key';
const IBM_REGION_STORAGE = 'quide_ibm_region';
const IBM_INSTANCE_CRN_STORAGE = 'quide_ibm_instance_crn';

export interface IBMCredentials {
  apiKey: string;
  region: string;
  instanceCrn?: string;
}

export const ibmKeyStorage = {
  save: (credentials: IBMCredentials) => {
    localStorage.setItem(IBM_KEY_STORAGE, credentials.apiKey);
    localStorage.setItem(IBM_REGION_STORAGE, credentials.region);
    if (credentials.instanceCrn) {
      localStorage.setItem(IBM_INSTANCE_CRN_STORAGE, credentials.instanceCrn);
    } else {
      localStorage.removeItem(IBM_INSTANCE_CRN_STORAGE);
    }
  },

  load: (): IBMCredentials | null => {
    const apiKey = localStorage.getItem(IBM_KEY_STORAGE);
    const region = localStorage.getItem(IBM_REGION_STORAGE);

    if (!apiKey || !region) {
      return null;
    }

    return {
      apiKey,
      region,
      instanceCrn: localStorage.getItem(IBM_INSTANCE_CRN_STORAGE) || undefined,
    };
  },

  clear: () => {
    localStorage.removeItem(IBM_KEY_STORAGE);
    localStorage.removeItem(IBM_REGION_STORAGE);
    localStorage.removeItem(IBM_INSTANCE_CRN_STORAGE);
  },

  hasKey: (): boolean => {
    return !!localStorage.getItem(IBM_KEY_STORAGE);
  },
};
