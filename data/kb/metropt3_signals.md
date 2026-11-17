<!-- source: real -->
<!-- Sensor descriptions from the MetroPT-3 dataset page, UCI Machine Learning Repository (doi:10.24432/C5VW3R, CC BY 4.0), paraphrased. -->
# MetroPT-3 compressor (air production unit) signals (real dataset documentation)

## Air production unit (APU) and compressor
MetroPT-3 records the air production unit (APU) of a Metro do Porto train: the compressor that produces the train's compressed air. Readings were logged from February to August 2020 by an onboard device, with 7 analog sensors and 8 digital signals. Four air-leak failures were reported by the operator in that period.

## Pressure sensors TP2, TP3, H1, DV pressure, reservoirs
TP2 is the pressure at the compressor. TP3 is the pressure at the pneumatic panel. H1 is the pressure drop when the cyclonic separator filter discharges. DV pressure is the pressure drop when the air-dryer towers discharge; a zero reading means the compressor is working under load. Reservoirs is the pressure downstream in the reservoirs, which should be close to the pneumatic panel pressure (TP3). An air leak shows up as pressure falling faster than normal.

## Motor current and oil temperature
Motor current is the current of one phase of the compressor motor: close to 0 A when off, about 4 A when working offloaded, about 7 A under load and about 9 A at start-up. Oil temperature is the temperature of the compressor oil. A compressor that has to run under load for longer than usual, for example to make up for a leak, draws more current for longer and runs hotter.

## Digital signals COMP, DV electric, towers, MPG
COMP is the air intake valve signal: active when there is no air intake, meaning the compressor is off or offloaded. DV electric controls the compressor outlet valve and is active while the compressor works under load, so its share of time on is the compressor's loaded duty. Towers indicates which of the two air-dryer towers is drying and which is draining. MPG starts the compressor under load when pressure in the APU falls below 8.2 bar.

## LPS low-pressure signal
LPS is active when air pressure drops below 7 bar. In MetroSched, minutes with LPS active in a train's sensor slice are shown as a low-pressure alert, and they count against sending that train into revenue service.

## Pressure switch, oil level and caudal impulses
The pressure switch detects discharge in the air-drying towers. The oil level signal concerns the compressor oil level (documented as active when oil is below the expected level; in the data it reads active during normal operation, so MetroSched does not use it). Caudal impulses count pulses proportional to the air flowing from the APU to the reservoirs.
