# Zendure Energy Card

Eine HACS-Lovelace-Karte für Zendure SolarFlow/Speichersysteme. Die Karte zeichnet die Energieanlage als kompakte Haus-/SolarFlow-Illustration und passt die Anzahl der Speicher- und Batteriemodule automatisch an die von der Zendure Home Assistant Integration gelieferten Sensoren an.

## Voraussetzungen

- Home Assistant 2026.2 oder neuer
- installierte Zendure Home Assistant Integration (`zendure_ha`)
- HACS

Die Karte liest ausschließlich bestehende `sensor.*`-Entitäten. Es werden keine zusätzlichen Zendure-Sensoren erzeugt.

## Installation mit HACS

**Wichtig:** Diese Karte ist ein **HACS Dashboard-Element (Plugin)**, keine Home-Assistant-Integration.

1. HACS → **Benutzerdefinierte Repositories** öffnen.
2. `https://github.com/leonsio/zendure-energy-card` hinzufügen.
3. Als Typ **Dashboard** auswählen.
4. **Zendure Energy Card** installieren bzw. neu herunterladen.
5. Browser vollständig neu laden (z. B. `Ctrl+F5`).
6. Dashboard bearbeiten → **Karte hinzufügen** → nach **Zendure Energy Card** suchen.

Bei HACS-Dashboard-Elementen wird die JavaScript-Datei aus `dist/` nach `www/community/` installiert und die Dashboard-Ressource von HACS verwaltet. Eine `custom_components`-Integration und ein Neustart von Home Assistant sind für diese Karte nicht erforderlich.

### Falls bereits 0.2.0 installiert ist

Die frühere 0.2.0-Struktur war fälschlicherweise als Custom Integration aufgebaut. Entferne daher in HACS die bisherige **Zendure Energy Card**, installiere das Repository anschließend erneut als **Dashboard** und lade den Browser komplett neu. Prüfe unter **Einstellungen → Dashboards → Ressourcen**, dass die Ressource auf die HACS-Datei zeigt.

## Verwendung

```yaml
type: custom:zendure-energy-card
```

Optional:

```yaml
type: custom:zendure-energy-card
title: SolarFlow
max_systems: 4
max_batteries: 8
```

## Automatische Erkennung

Die Karte erkennt die von `zendure_ha` bereitgestellten Sensoren über die Entity-ID-Endungen:

- `sensor.*_grid_off_power`
- `sensor.*_solar_input_power`
- `sensor.*_electric_level`
- `sensor.*_pack_num`

Ein Speichersystem wird über sein `*_electric_level` erkannt. `*_pack_num` bestimmt die Anzahl der zugehörigen Batterien. Wenn `pack_num` nicht verfügbar ist, wird vorübergehend eine Batterie für das erkannte System dargestellt.

## Berechnungen

### Off-Grid-Steckdosenlast

```text
Sum(max(grid_off_power, 0))
```

Negative Werte werden **nicht** als Last berücksichtigt.

### Solarleistung

```text
Sum(max(solar_input_power, 0))
+ Sum(abs(grid_off_power)) für alle negativen grid_off_power
```

Ein negativer `grid_off_power`-Wert wird damit als zusätzliche Solarleistung behandelt.

### Batterie-SoC

Der angezeigte SoC ist der arithmetische Mittelwert aller verfügbaren `*_electric_level`-Sensoren und wird auf 0–100 % begrenzt.

## Darstellung

- Hell- und Dunkelmodus folgen automatisch dem Home-Assistant-Theme.
- Haus, Dach, Fenster und Solarmodule sind als SVG direkt in der Karte enthalten.
- Ein System mit einer Batterie wird kompakt dargestellt.
- Mehrere Systeme werden nebeneinander dargestellt.
- Jede zusätzliche Batterie wird als eigenes Batteriemodul dargestellt.
- Die Speicher zeigen ihren jeweiligen SoC visuell.
- Die zentrale Beschriftung zeigt `X Speicher · Y Batterien`.
- Die Karte ist responsive und für kleine Displays optimiert.

## Architektur

Die Karte ist bewusst nur ein Lovelace-Frontend-Plugin. Sie verwendet die von Home Assistant bereits bereitgestellten `hass.states` und verändert weder das Zendure-Repository noch die `zendure_ha`-Integration.

## Lizenz

MIT
