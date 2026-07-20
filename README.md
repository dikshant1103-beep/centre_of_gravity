# Motorcycle Centre of Gravity Calculator

Work out where a motorcycle's centre of gravity actually sits, then see what
that does to the bike under braking, acceleration and cornering.

You give it component masses and positions — engine, frame, fuel, battery,
exhaust, swingarm, rider, pillion, luggage — and it returns the CoG, the
static axle loads, the load transferred at each wheel under given
decelerations, and the steering trail implied by the rake and fork offset.

Eleven bike families ship with realistic default geometry, so you can start
from something sensible rather than a blank form: sport, naked, adventure,
touring, cruiser, sport-touring, off-road, commuter, scooter, EV scooter and
EV motorcycle.

## Running it

    npm install
    npm run dev

## The maths

Centre of gravity, as a mass-weighted mean of the components:

    X_cg = Σ(mᵢ · xᵢ) / Σ(mᵢ)
    Y_cg = Σ(mᵢ · yᵢ) / Σ(mᵢ)

Static axle reactions from the wheelbase:

    R_front = W_total × (WB − X_cg) / WB
    R_rear  = W_total × X_cg / WB

Longitudinal load transfer — the reason the rear goes light under hard
braking, and why CoG height matters more than most people expect:

    ΔW_brake = m · a · Y_cg / WB
    ΔW_accel = m · a · Y_cg / WB

Lateral transfer in a corner, over the track rather than the wheelbase:

    ΔW_corner = m · a_lat · Y_cg / Track

Steering trail from head angle and fork offset:

    Trail = R · cos(rake) / sin(rake) − fork_offset

## Scope

A design-stage estimator. It assumes rigid masses at fixed points — no
suspension travel, no chassis flex, no aerodynamic load, no tyre deformation.
That's the right level for early geometry decisions and for building intuition
about which masses actually move the CoG; it is not a substitute for measuring
a real bike or for a multibody simulation.

Component positions are measured from the front axle, in millimetres, with Y
upward from the ground.
