# Maestro-flows

End-to-end tests voor een development- of preview-build op een simulator of toestel.

```bash
# Maestro installeren: https://maestro.mobile.dev
maestro test -e WACHTWOORD='<reviewer-wachtwoord>' e2e/maestro/01-reviewer-login.yaml
maestro test e2e/maestro/02-alarm-aanmaken.yaml
maestro test e2e/maestro/03-tabs.yaml
maestro test e2e/maestro/04-testalarm.yaml   # echt alarm: iOS 26 of Android
maestro test e2e/maestro/05-proefronde.yaml
```

Draai 04 en 05 vóór elke TestFlight-build: ze controleren dat een alarm afgaat, wordt afgerond en
dat het missiescherm altijd sluit.

Het reviewer-wachtwoord staat niet in de repo. Echte alarmen en de camera-missie zijn niet te
automatiseren en test je met de hand (Profiel → Test je alarm).

## In GitHub Actions

Actions → **Maestro (Android-emulator)** → Run workflow, met de downloadlink van een
preview-APK uit EAS. Zet eerst het repository-secret `REVIEWER_WACHTWOORD`. Het rapport staat
daarna als artefact `maestro-rapport` bij de run.
