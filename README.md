# Prepare signing for iOS build action

This action helps to provide necessary certificates and provisioning profiles for `xcodebuild`'s `archive` and `exportArchive` commands.

It can import the provided singing certificate into an unlocked keychain. It fetches the proper provisioning profile into folder `~/Library/MobileDevice/Provisioning Profiles`.

**Please use secrets when appropriate!**

[How to add a secrets?](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets)

Base64 encoded string of a p12 file can be created with the below command
```bash
base64 path/to/p12/file
```

## Inputs

### `appStoreConnectPrivateKey`

**Required** App Store Connect private key with proper rights.

### `keyID`

**Required** Identifier of the private key.

### `issuerID`

**Required** Issuer identifier.

### `keychainName`

**Optional** Id of the temporary keychain. Default `signing.ios`.

### `keychainPassword`

**Optional** Password of temporary keychain. Default `signing.ios`.


### `base64P12File`

**Required** Base64 encoded .p12 signing cert with private key.

### `base64ExtensionP12File`

**Required** Base64 encoded .p12 signing cert FOR EXTENSION with private key (uses same pwd).

### `p12Password`

**Required** Password of the .p12 file.

### `bundleIdentifier`

**Required** Bundle identifier of the application.

### `signType`

**Required** E.g.: IOS_APP_DEVELOPMENT, IOS_APP_STORE etc.

## Example usage
```yaml
- name: Prepare signing
  uses: ngeri/prepare-signing@v1.0.2
  with:
    appStoreConnectPrivateKey: ${{ secrets.appStoreConnectPrivateKey }}
    keyID: ${{ env.keyID }}
    issuerID: ${{ env.issuerID }}
    keychainName: ${{ secrets.keychainName }}
    keychainPassword: ${{ secrets.keychainPassword }}
    base64P12File: ${{ secrets.base64P12File }}
    p12Password: ${{ secrets.p12Password }}
    bundleIdentifier: ${{ env.bundleIdentifier }}
    signType: ${{ env.signType }}
```
