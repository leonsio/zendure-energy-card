# Zendure Energy Card

Eine HACS-Lovelace-Karte für Zendure SolarFlow/Speichersysteme. Version **0.2.0** zeichnet die Energieanlage als kompakte Haus-/SolarFlow-Illustration und passt die Anzahl der Speicher- und Batteriemodule automatisch an die von der Zendure Home Assistant Integration gelieferten Sensoren an.

## Voraussetzungen

- Home Assistant 2026.2 oder neuer
- installierte Zendure Home Assistant Integration (`zendure_ha`)
- HACS

Die Karte liest ausschließlich bestehende `sensor.*`-Entitäten. Es werden keine zusätzlichen Zendure-Sensoren erzeugt.

## Installation

1. In HACS **Benutzerdefinierte Repositories** öffnen.
2. `https://github.com/leonsio/zendure-energy-card` als Repository vom Typ **Integration** hinzufügen.
3. **Zendure Energy Card** installieren.
4. Home Assistant neu starten.
5. Die Ressource wird vom Helper automatisch als Lovelace-Modul registriert. Bei einem Update wird die Resource-URL mit der Versionsnummer aktualisiert (`?v=0.2.0`), damit der Browser kein altes JavaScript aus dem Cache verwendet.
6. Im Dashboard **Zendure Energy Card** auswählen.

Alternativ im YAML-Modus:

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

Ein Speichersystem wird über sein `*_electric_level` erkannt. `*_pack_num` bestimmt die Anzahl der zugehörigen Batterien. Wenn `pack_num` noch nicht verfügbar ist, wird vorübergehend eine Batterie für das erkannte System dargestellt.

## Berechnungen

### Off-Grid-Steckdosenlast

Für jedes `*_grid_off_power` gilt:

```text
Sum(max(grid_off_power, 0))
```

Negative Werte werden **nicht** als Last berücksichtigt.

### Solarleistung

```text
Sum(max(solar_input_power, 0))
+ Sum(abs(grid_off_power)) für alle negativen grid_off_power
```

Damit wird ein negativer `grid_off_power`-Wert als zusätzliche Solarleistung behandelt, wie von der gewünschten Darstellung vorgegeben.

### Batterie-SoC

Der angezeigte SoC ist der arithmetische Mittelwert aller verfügbaren `*_electric_level`-Sensoren:

```text
Sum(electric_level) / Anzahl der Systeme
```

Der Wert wird auf 0–100 % begrenzt und auf ganze Prozent gerundet.

## Darstellung 0.2.0

- Hell- und Dunkelmodus werden automatisch aus dem Home-Assistant-Theme abgeleitet.
- Das Haus, Dach, Fenster und die Solarmodule sind als SVG direkt in der Karte enthalten.
- Ein System mit einer Batterie wird kompakt dargestellt.
- Mehrere Systeme werden nebeneinander dargestellt.
- Jede zusätzliche Batterie wird als eigenes Batteriemodul dargestellt.
- Die Speicher zeigen den jeweiligen SoC visuell im Geräte-Display.
- Die zentrale Beschriftung zeigt immer `X Speicher · Y Batterien`.
- Auf kleinen Displays wird die Darstellung automatisch verkleinert.

## Architektur

Die Integration dient nur dazu, die statische Lovelace-JavaScript-Datei sicher bereitzustellen und automatisch als Resource zu registrieren. Die Karte selbst berechnet ihre Werte im Browser aus `hass.states`. Dadurch werden keine neuen Sensoren angelegt und die bestehende `zendure_ha`-Integration bleibt unverändert.

## Lizenz

MIT
