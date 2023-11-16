const core = require('@actions/core');
const shell = require('shelljs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

function getToken(issuerID, minute, privateKey, keyId) {
  const payload = { 
    exp: Math.floor(Date.now() / 1000) + (minute * 60),
    aud: "appstoreconnect-v1",
    iss: issuerID
  };
  const options = {
    algorithm: "ES256",
    header: { 
      kid: keyId
    }
  }
  return jwt.sign(payload, privateKey, options);
}

async function get(url, params, token, method = "GET") {
  const options = {
    url: url,
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    params: params
  }

  const response = await axios.request(options);
  return response.data;
}

function setupProvisioning(profileContent, profileUUID) {
  const profileName = `${profileUUID}.mobileprovision`;
  shell.exec(`mkdir -p ~/Library/MobileDevice/Provisioning\\ Profiles`);
  shell.exec(`(echo ${profileContent} | base64 --decode) > ~/Library/MobileDevice/Provisioning\\ Profiles/${profileName}`);
}

function setupKeychain(keychainName, keychainPassword, base64P12File, p12Password, base64ExtensionP12File) {
  const tempCertificateName = `tmp.p12`;
  const tempCertificateName2 = `tmp2.p12`;
  shell.exec(`(echo "${base64P12File}" | base64 --decode) > "${tempCertificateName}"`);
  shell.exec(`(echo "${base64ExtensionP12File}" | base64 --decode) > "${tempCertificateName2}"`);
  shell.exec(`security create-keychain -p "${keychainPassword}" "${keychainName}"`);
  shell.exec(`security list-keychains -d user -s login.keychain "${keychainName}"`);
  shell.exec(`security import "${tempCertificateName}" -A -k "${keychainName}" -P "${p12Password}"`);
  shell.exec(`security import "${tempCertificateName2}" -A -k "${keychainName}" -P "${p12Password}"`);
  shell.exec(`security set-keychain-settings -lut 1000 "${keychainName}"`);
  shell.exec(`security default-keychain -s "${keychainName}"`);
  shell.exec(`security unlock-keychain -p "${keychainPassword}" "${keychainName}"`);
  shell.exec(`security set-key-partition-list -S apple-tool:,apple: -s -k "${keychainPassword}" "${keychainName}"`);
  shell.exec(`rm ${tempCertificateName}`);
  shell.exec(`rm ${tempCertificateName2}`);
}

async function run() {
  try {

    const appStoreConnectPrivateKey = core.getInput(`appStoreConnectPrivateKey`);
    const keyID = core.getInput(`keyID`);  
    const issuerID = core.getInput(`issuerID`);
    const keychainName = core.getInput(`keychainName`);
    const keychainPassword = core.getInput(`keychainPassword`);
    const base64P12File = core.getInput(`base64P12File`);
    const base64ExtensionP12File = core.getInput(`base64ExtensionP12File`);
    const p12Password = core.getInput(`p12Password`);
    const bundleIdentifier = core.getInput(`bundleIdentifier`);
    const bunldeIdentifier2 = `tech.metric.APNSExtension`;
    const signType = core.getInput(`signType`);

    const token = getToken(issuerID, 2, Buffer.from(appStoreConnectPrivateKey, "utf8"), keyID);
    
    const bundleIdResponse = await get("https://api.appstoreconnect.apple.com/v1/bundleIds", { "filter[identifier]": bundleIdentifier }, token); // BundleIdsResponse Type
    const bundleId = bundleIdResponse.data.find(element => element.attributes.identifier == bundleIdentifier);

    
    console.log(bundleId);
    if (bundleId) {
      const profileIds = await get(`https://api.appstoreconnect.apple.com/v1/bundleIds/${bundleId.id}/relationships/profiles`, { }, token);  
      const rawProfileIds = profileIds.data.map(profile => profile.id);

      if (rawProfileIds) {
        const profilesResponse = await get("https://api.appstoreconnect.apple.com/v1/profiles", { "filter[id]": `${rawProfileIds}`, "filter[profileType]": signType }, token); // ProfilesResponse Type
        const profile = profilesResponse.data[0];

        if (profile) {
          const profileContent = profile.attributes.profileContent;
          const profileUUID = profile.attributes.uuid;

          setupProvisioning(profileContent, profileUUID);
          
   //       setupKeychain(keychainName, keychainPassword, base64P12File, p12Password, base64ExtensionP12File);
        } else {
          throw `Could not find matching provisioning profile for ${bundleIdentifier} on Developer Portal. Please check it on https://developer.apple.com/account/`;  
        }
      } else {
        throw `Could not find provisioning profiles for ${bundleIdentifier} on Developer Portal. Please check it on https://developer.apple.com/account/resources/profiles/list`;
      }
    } else {
      throw `Could not find bundleIdentifier ${bundleIdentifier} on Developer Portal. Please check it on https://developer.apple.com/account/resources/identifiers/list`;
    }
    console.log("starting job #2 for bundle id 2");
    const bundleIdResponse2 = await get("https://api.appstoreconnect.apple.com/v1/bundleIds", { "filter[identifier]": bunldeIdentifier2 }, token); // BundleIdsResponse Type
    const bundleId2 = bundleIdResponse2.data.find(element => element.attributes.identifier == bunldeIdentifier2);
    console.log(bundleId2);
    console.log("found responses");
    if (bundleId2) {
      const profileIds = await get(`https://api.appstoreconnect.apple.com/v1/bundleIds/${bundleId.id}/relationships/profiles`, { }, token);  
      const rawProfileIds = profileIds.data.map(profile => profile.id);

      if (rawProfileIds) {
        const profilesResponse = await get("https://api.appstoreconnect.apple.com/v1/profiles", { "filter[id]": `${rawProfileIds}`, "filter[profileType]": signType }, token); // ProfilesResponse Type
        const profile = profilesResponse.data[0];

        if (profile) {
          const profileContent = profile.attributes.profileContent;
          const profileUUID = profile.attributes.uuid;

          setupProvisioning(profileContent, profileUUID);
          
          setupKeychain(keychainName, keychainPassword, base64P12File, p12Password, base64ExtensionP12File);
        } else {
          throw `Could not find matching provisioning profile for ${bundleIdentifier} on Developer Portal. Please check it on https://developer.apple.com/account/`;  
        }
      } else {
        throw `Could not find provisioning profiles for ${bundleIdentifier} on Developer Portal. Please check it on https://developer.apple.com/account/resources/profiles/list`;
      }
    } else {
      throw `Could not find bundleIdentifier ${bundleIdentifier} on Developer Portal. Please check it on https://developer.apple.com/account/resources/identifiers/list`;
    }

    
  } catch (error) {
    core.setFailed(error.message);
  }
} 

run();
