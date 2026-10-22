# Mapkepp Tools — Smart Home Shortcut Studio

Public demo: https://mapkepp.github.io/loto-generator/public-tools-hub/

**Status: MVP (22 October 2026).** Free, independent and unofficial community project.

## Features
- Device on/off and brightness; group on/off and brightness; scenario launch.
- Live preview of official Yandex Smart Home HTTP request and copy request metadata.
- Offline-in-browser XML plist generator for Apple Shortcuts. No dependency on browser JavaScript libraries.
- Optional **user-approved** cross-origin HTML form submission of the **unsigned** shortcut to the documented [Shortcuty Signing API](https://github.com/Shortcuty/Signing-Server-API-Documentation). Apple signatures are required for third-party import.
- Import-time prompt for user's Yandex OAuth token; the token never needs to be entered on the website. The unsigned Shortcut may contain entered device/group/scenario identifiers, which are sent to Shortcuty when signing.
- Experimental VPN disconnect/reconnect with explicit warning; users select their local VPN profile after importing. A failed action may leave VPN disconnected.

## Privacy and rights
No sign-up, analytics, cookies, user accounts, token fields or device-control API requests on this static web page. Everything except optional signing takes place client-side. No data is stored by this application. GitHub Pages and the third-party signer have their own logging and policies.

Use only devices and accounts you are authorized to control. No affiliation with Apple or Yandex; product names are used for compatibility descriptions and do not imply endorsement.

API docs: https://yandex.ru/dev/dialogs/smart-home/doc/ru/concepts/platform-protocol

## Donations
All functionality is free and identical for everyone. Visitors can voluntarily support the project through the [T-Bank donation link](https://t.tb.ru/pm_short/7Ixu10XDRWa). The website itself does not process payments or bank card details and donations do not unlock functions, services, or priorities. The link opens a third-party payment page; actual payment completion has not been independently verified. Tax and payment treatment depends on facts and law; labeling a payment a donation does not automatically make it non-taxable.

## Publish in a separate GitHub repository
This directory is currently **staged under mapkepp/loto-generator** because the connected GitHub integration cannot create repositories. Intended permanent repository: `mapkepp/mapkepp-tools`.

1. Create a **public** repository `mapkepp-tools` on GitHub (do not include secrets).
2. Copy this directory's files to the root of the new repository.
3. GitHub → Settings → Pages → Deploy from a branch → main → /(root). Public URL is then `https://mapkepp.github.io/mapkepp-tools/`.
4. Update the footer's source/issue links from `loto-generator` to `mapkepp-tools`.
5. Test on Safari/iOS. Never place Yandex OAuth tokens in issues, URL query strings, site files or GitHub repositories.

No user's local computer is needed for the staged version.

## Current verification
- Public HTTPS page: PASS (HTTP 200).
- Six request/configuration variants: PASS (browser regression checks).
- XML plist generation, true/false, integer number, ID and OAuth-token absence: PASS.
- Apple AEA1 signer integration tested on scenario and VPN/non-VPN variants: PASS using **synthetic** IDs only.
- Real iPhone iOS 26.6.2 import, VPN reconnection, device control, Safari cross-origin form downloads: **NOT_TESTED**.
- Separate repository: **NOT_DONE**. T-Bank donation URL: **CONFIGURED** in the public tools page; external payment processing: **NOT_TESTED**.
