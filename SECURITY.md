# Security policy

## Reporting a vulnerability

Please **don't open a public issue** for a security problem. Report it privately instead: on the repository's **Security** tab, click **Report a vulnerability** ([direct link](https://github.com/n3oraZor/OldPadDeck/security/advisories/new)). Include what an attacker can do, the steps to reproduce, and your macOS / iPad versions.

This is a one-person hobby project: expect an answer within a few days, and a fix in the next release as soon as possible. Only the latest release is supported.

## Threat model

- **Assumption:** the Mac and the iPad are on a home network you trust. Traffic is plain HTTP / WebSocket, without TLS, so anyone who can see it can steal a paired device's token. Untrusted networks (café, hotel, office Wi-Fi) are out of scope: quit the app there.
- **A paired device is fully trusted:** it has user-level control of the Mac (keys, typing, pointer, apps, links, Shortcuts, quitting apps). Revoke lost or sold devices from the menu bar (Paired Devices); their token stops working at once.
- **Pairing** needs the 6-digit PIN shown on the Mac, accepted only while the "Pair a Device…" window is open; it works once and expires after 3 minutes or 5 wrong tries (all addresses combined).
- **Network exposure:** the server (port 8765) answers only clients on the Mac's own local subnets. Device tokens are random, sent as HttpOnly cookies, and stored on the Mac only as SHA-256 hashes; WebSocket connections must come from the app's own origin.
- **In scope:** anything that lets someone who has *not* paired control the Mac or read its data, escapes the local-subnet or pairing checks, or makes a paired device do more than the app's documented actions.
