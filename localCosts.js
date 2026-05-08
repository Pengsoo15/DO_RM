const PH_GOV_DATA = {

    inflation: {
        annual_rate: 0.032,
        food_inflation: 0.042,
        transport_inflation: 0.028,
        utility_inflation: 0.025,
        monthly_factor: function (months = 1) {
            return Math.pow(1 + this.annual_rate / 12, months);
        }
    },

    fuel: {
        gasoline: { min: 61.50, max: 68.00, average: 64.50 },
        diesel: { min: 88.00, max: 95.00, average: 90.00 },
        motorcycle_kml: 40,
        tricycle_kml: 20,
        daily_motorcycle_cost: function (km = 15) {
            return (km / this.motorcycle_kml) * this.gasoline.average;
        }
    },

    transport_fares: {
        jeepney: {
            base: 14,
            per_km: 1.80,
            daily_avg: 28
        },
        traditional_jeepney: {
            base: 13,
            per_km: 1.50,
            daily_avg: 26
        },
        bus: {
            aircon_base: 15,
            ordinary_base: 12,
            per_km: 2.65,
            aircon_per_km: 3.00,
            daily_avg: 40
        },
        tricycle: {
            base: 20,
            per_km: 10,
            daily_avg: 50
        },
        UV_express: {
            base: 20,
            per_km: 2.40,
            daily_avg: 60
        },
        ride_hailing: {
            car_base: 49,
            car_per_km: 20,
            car_per_min: 2,
            bike_base: 40,
            bike_per_km: 12,
            daily_car_avg: 300,
            daily_bike_avg: 150
        }
    },

    food_prices: {
        rice: {
            well_milled: { min: 41, max: 45, average: 43 },
            special: { min: 45, max: 52, average: 48 },
            premium: { min: 55, max: 75, average: 65 },
            per_meal_grams: 200,
            per_meal_cost: function () {
                return (this.per_meal_grams / 1000) * this.well_milled.average;
            }
        },
        vegetables: {
            ampalaya: { min: 60, max: 100, average: 80 },
            kangkong: { min: 20, max: 40, average: 30 },
            sitaw: { min: 40, max: 80, average: 60 },
            tomato: { min: 30, max: 90, average: 60 },
            eggplant: { min: 30, max: 60, average: 45 },
            per_meal_estimate: 15
        },
        protein: {
            chicken: { min: 180, max: 240, average: 210 },
            pork: { min: 290, max: 380, average: 330 },
            bangus: { min: 150, max: 200, average: 175 },
            tilapia: { min: 120, max: 160, average: 140 },
            eggs_per_piece: { min: 8, max: 11, average: 9 },
            canned_sardines_per_can: { min: 18, max: 25, average: 20 }
        },
        meal_cost_models: {
            survival: { min: 30, max: 50, average: 40 },
            budget: { min: 55, max: 80, average: 65 },
            standard: { min: 80, max: 120, average: 95 },
            comfortable: { min: 130, max: 200, average: 160 }
        }
    },

    utilities: {
        electricity: {
            meralco_rate_per_kwh: 11.50,
            dorm_solo_kwh: 50,
            dorm_with_ac_kwh: 120,
            monthly_solo_no_ac: function () { return this.dorm_solo_kwh * this.meralco_rate_per_kwh; },
            monthly_solo_with_ac: function () { return this.dorm_with_ac_kwh * this.meralco_rate_per_kwh; },
            shared_split_avg: 150
        },
        water: {
            maynilad_per_cu_m: 42.00,
            monthly_student_cubic_meters: 3,
            monthly_estimate: 150
        },
        internet: {
            budget_plan: 999,
            standard_plan: 1299,
            shared_split: 300
        },
        laundry: {
            laundromat_per_load: 60,
            loads_per_month: 4,
            monthly_estimate: 240
        }
    },

    eating_out_patterns: {
        street_food: { average: 40, range: [25, 65] },
        canteen: { average: 70, range: [55, 90] },
        fastfood: { average: 130, range: [100, 180] },
        milktea: { average: 100, range: [65, 160] },
        convenience: { average: 70, range: [40, 120] }
    },

    student_benchmarks: {
        poverty_threshold_metro: 4200,
        min_survival_budget: 5500,
        school_supplies_monthly: {
            light: 300,
            medium: 700,
            heavy: 1500
        },
        org_fees_monthly: 200,
        recommended_emergency_ratio: 0.08
    },

    housing: {
        bedspace: { min: 1500, max: 3500, average: 2500 },
        shared_room: { min: 2500, max: 5000, average: 3500 },
        solo_room: { min: 4500, max: 9000, average: 6500 },
        studio_condo: { min: 8000, max: 20000, average: 12000 }
    }
};

const LOCAL_COSTS = {
    meals: {
        cheapest: PH_GOV_DATA.food_prices.meal_cost_models.survival.average,
        budget: PH_GOV_DATA.food_prices.meal_cost_models.budget.average,
        average: PH_GOV_DATA.food_prices.meal_cost_models.standard.average,
        nice: PH_GOV_DATA.food_prices.meal_cost_models.comfortable.average
    },
    transport: {
        jeepney: { cost: PH_GOV_DATA.transport_fares.jeepney.base, daily: PH_GOV_DATA.transport_fares.jeepney.daily_avg },
        tricycle: { cost: PH_GOV_DATA.transport_fares.tricycle.base, daily: PH_GOV_DATA.transport_fares.tricycle.daily_avg },
        bus: { cost: PH_GOV_DATA.transport_fares.bus.aircon_base, daily: PH_GOV_DATA.transport_fares.bus.daily_avg },
        motorcycle: { cost: 0, daily: Math.round(PH_GOV_DATA.fuel.daily_motorcycle_cost()) },
        ridehailing: { cost: PH_GOV_DATA.transport_fares.ride_hailing.bike_base, daily: PH_GOV_DATA.transport_fares.ride_hailing.daily_car_avg },
        walking: { cost: 0, daily: 0 }
    },
    housing: {
        bedspace: PH_GOV_DATA.housing.bedspace,
        shared: PH_GOV_DATA.housing.shared_room,
        solo: PH_GOV_DATA.housing.solo_room
    },
    wifi: PH_GOV_DATA.utilities.internet.shared_split,
    electricity: PH_GOV_DATA.utilities.electricity.shared_split_avg,
    school: {
        books: PH_GOV_DATA.student_benchmarks.school_supplies_monthly.medium,
        supplies: 300,
        projects: 400,
        misc: PH_GOV_DATA.student_benchmarks.org_fees_monthly
    }
};

const ALLOCATION_PERCENTAGES = {
    rent: { min: 25, max: 40, target: 30 },
    food: { min: 25, max: 35, target: 30 },
    transport: { min: 5, max: 15, target: 10 },
    utilities: { min: 3, max: 8, target: 5 },
    school: { min: 5, max: 12, target: 8 },
    emergency: { min: 5, max: 10, target: 8 }
};
