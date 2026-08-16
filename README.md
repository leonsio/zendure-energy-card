# Zendure Energy Card

Eine HACS-Lovelace-Karte für Zendure SolarFlow/Speichersysteme. **Version 0.4.0** verwendet das von Zendure inspirierte, hohe Smartphone-Layout mit einem statischen fotografischen Hintergrundbild. Alle aktuellen Werte, Speicher, Batterien, SoC-Anzeigen und Energieflüsse werden darüber zur Laufzeit als HTML/CSS-Layer eingeblendet.

## Vorschau

![Zendure Energy Card v0.4.0](assets/D8115BEE-72BC-416B-BF22-7CD8CAB89625.png)

Das PNG ist die statische Basisgrafik. Die tatsächliche Lovelace-Karte legt darüber dynamische Informationen aus Home Assistant und animierte Energiefluss-Layer.

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
4. **Zendure Energy Card** installieren bzw. auf Version 0.4.0 aktualisieren.
5. Browser/WebView vollständig neu laden.
6. Dashboard bearbeiten → **Karte hinzufügen** → **Zendure Energy Card**.

Bei HACS-Dashboard-Elementen wird die JavaScript-Datei aus `dist/` installiert und als Lovelace-Ressource eingebunden. Das Hintergrundbild wird relativ zur geladenen JavaScript-Datei aus `assets/` referenziert. Eine `custom_components`-Integration und ein Neustart von Home Assistant sind für diese Karte nicht erforderlich.

### Falls bereits eine ältere Version installiert ist

Entferne die bisherige **Zendure Energy Card** in HACS, installiere das Repository anschließend erneut als **Dashboard** und lade den Browser vollständig neu. Falls unter **Einstellungen → Dashboards → Ressourcen** noch eine alte Resource eingetragen ist, diese entfernen.

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

## Darstellung 0.4.0

- **hohe Portrait-Karte**, auf Smartphones ungefähr 3/4 der Bildschirmhöhe
- statisches fotografisches Zendure-Haus-/Solardach als Hintergrund
- keine nachgebaute SVG-Hausgrafik mehr
- dynamische HTML/CSS-Overlays für Live-Werte
- eigener SoC pro erkanntem Speichersystem
- dynamische Darstellung der Speicher- und Batterieanzahl
- zentrale Anzeige `X Speicher · Y Batterien`
- animierte Energieflusslinien mit Richtung
- Gelb = Solar, Grün = Batterie, Blau = Verbrauch, Violett = Netz
- Animation reduziert sich automatisch bei `prefers-reduced-motion`
- responsive für Smartphone, Tablet und Desktop

## Architektur

Die Karte ist bewusst nur ein Lovelace-Frontend-Plugin. Sie verwendet die von Home Assistant bereitgestellten `hass.states` und verändert weder das Zendure-Repository noch die `zendure_ha`-Integration.

Die visuelle Basis besteht aus `assets/D8115BEE-72BC-416B-BF22-7CD8CAB89625.png`. Die JavaScript-Datei zeichnet darüber ausschließlich die dynamischen Daten und Animationen. Dadurch bleibt das fotografische Bild unverändert, während alle Werte live aktualisiert werden.

## Lizenz

MIT
