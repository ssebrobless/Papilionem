# 03 Sleep State Machine

Target output:

`docs/guidebook/diagrams/03-sleep-state-machine.png`

```text
Create a state machine diagram for Papilionem's sleep system.

States:
- awake
- settling_sleep
- normal_sleep
- oversleeping
- forced_battle_sleep

Transitions:
- awake to settling_sleep when exhaustion threshold is crossed
- awake to forced_battle_sleep when forced sleep effect lands
- settling_sleep to normal_sleep after settling duration
- settling_sleep back to awake if interrupted
- normal_sleep to awake when recovery threshold is met
- normal_sleep to oversleeping when oversleep pressure is high
- oversleeping to awake when oversleep finishes
- forced_battle_sleep to awake when forced sleep effect ends

Also include side inputs:
- sleepComfort
- wakeResistance
- sleepRecoveryMultiplier
- insomniaBias
- oversleepBias

Make it readable enough for both designers and testers.
```
