# iPhone shortcuts — Yandex kitchen light

Two signed Apple Shortcuts for the Yandex Smart Home on/off capability.

- **Kitchen_Light_ON.shortcut** — turn kitchen light ON.
- **Kitchen_Light_OFF.shortcut** — turn kitchen light OFF.

At installation, each shortcut prompts for the current Yandex OAuth token **without** the leading `Bearer` text. The token is NOT included in the distributed files and is not checked into this repository.

Use Safari on iPhone to download a `.shortcut`, open it in the Shortcuts app, review its actions and enter the token when prompted. The import must be approved by the user.

Both files were signed successfully (Apple AEA1 format) and their unsigned content was structurally checked, including action names, POST method, JSON types, and HTTPS endpoint. Actual device execution on iOS 26.6.2 is NOT_TESTED.

SHA-256:
- ON: c91fe62140d74e70983d34381cf8b79348a1852b3fa585aaf0c213ed25b65355
- OFF: 13988b58a64d296b45bc84fa4a634fdf20ae26c96a030eee525ce22462d0a5f1
