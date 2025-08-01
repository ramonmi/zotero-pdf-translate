import { getService, SERVICES } from "../utils/config";
import { clearPref, getPref, getPrefJSON, setPref } from "../utils/prefs";
import { getServiceSecret, setServiceSecret } from "../utils/secret";

export function setDefaultPrefSettings() {
  const isZhCN = Zotero.locale === "zh-CN";
  const servicesIds = SERVICES.map((service) => service.id);
  if (!servicesIds.includes((getPref("translateSource") as string) || "")) {
    // Google Translate is not accessible in China mainland
    setPref("translateSource", isZhCN ? "haici" : "googleapi");
  }
  if (!servicesIds.includes((getPref("dictSource") as string) || "")) {
    setPref("dictSource", isZhCN ? "bingdict" : "freedictionaryapi");
  }

  if (!getPref("targetLanguage")) {
    setPref("targetLanguage", Zotero.locale);
  }

  const secrets = getPrefJSON("secretObj");
  for (const serviceId of servicesIds) {
    if (typeof secrets[serviceId] === "undefined") {
      secrets[serviceId] = getService(serviceId).defaultSecret || "";
    }
  }
  setPref("secretObj", JSON.stringify(secrets));

  // From v2.2.22, migrate previous settings in secrets to prefs
  const deeplxApiSecret = getServiceSecret("deeplcustom");
  if (deeplxApiSecret && !getPref("deeplcustom.endpoint")) {
    setPref("deeplcustom.endpoint", deeplxApiSecret);
  }

  if (isZhCN && !getPref("disabledLanguages")) {
    setPref("disabledLanguages", "zh,zh-CN,中文;");
  }

  const extraServices = getPref("extraEngines") as string;
  if (extraServices.startsWith(",")) {
    setPref("extraEngines", extraServices.slice(1));
  }

  // For NiuTrans login. niutransLog is deprecated.
  const niutransApiKey = getPref("niutransApikey") as string;
  if (niutransApiKey) {
    setServiceSecret("niutranspro", niutransApiKey);
    clearPref("niutransApikey");
  }
  if (getPref("translateSource") === "niutransLog") {
    setPref("translateSource", "niutranspro");
  }
  try {
    const oldDict = JSON.parse(
      (getPref("niutransDictLibList") as string) || "{}",
    );
    if (oldDict?.dlist) {
      setPref("niutransDictLibList", JSON.stringify(oldDict.dlist));
    } else {
      setPref("niutransDictLibList", "[]");
    }
    const oldMemory = JSON.parse(
      (getPref("niutransMemoryLibList") as string) || "{}",
    );
    if (oldMemory?.mlist) {
      setPref("niutransMemoryLibList", JSON.stringify(oldMemory?.mlist));
    } else {
      setPref("niutransMemoryLibList", "[]");
    }
  } catch (e) {
    setPref("niutransDictLibList", "[]");
    setPref("niutransMemoryLibList", "[]");
  }
}
