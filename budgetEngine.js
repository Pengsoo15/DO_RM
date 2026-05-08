/* global PH_GOV_DATA, Storage, LOCAL_COSTS */
const BudgetEngine = {
    calculateTotalTransportCost: function (transports, daysPerMonth) {
        daysPerMonth = daysPerMonth || 22;
        let totalMonthly = 0;
        let totalDaily = 0;

        transports.forEach(transport => {
            let costPerDay = parseFloat(transport.cost) || 0;

            if (transport.type === 'walk') {
                costPerDay = 0;
            }
            else if (transport.type === 'ridehailing' && costPerDay === 0) {
                costPerDay = PH_GOV_DATA.transport_fares.ride_hailing.daily_car_avg;
            }
            else if ((transport.type === 'motorcycle') && costPerDay === 0) {
                costPerDay = Math.round(PH_GOV_DATA.fuel.daily_motorcycle_cost());
            }

            if (transport.tripType === 'twoway') {
                costPerDay = costPerDay * 2;
            }

            totalDaily += costPerDay;
            totalMonthly += costPerDay * daysPerMonth;
        });

        return { daily: totalDaily, monthly: totalMonthly };
    },

    calculateSnackExpense: function (userData) {
        const frequency = parseInt(userData.snackDailyFrequency) || 0;
        const price = parseFloat(userData.snackPriceRange) || 0;
        const leakage = parseFloat(userData.leakageLevel) || 0;

        let monthlySnacks = frequency * price * 30;

        const govDriftFactor = 0.10;
        monthlySnacks = monthlySnacks * (1 + leakage + govDriftFactor);

        return Math.round(monthlySnacks);
    },

    calculateRealisticFoodBudget: function (mealsPerDay, setup = 'standard') {
        const mealCostMap = {
            survival: PH_GOV_DATA.food_prices.meal_cost_models.survival.average,
            budget: PH_GOV_DATA.food_prices.meal_cost_models.budget.average,
            standard: PH_GOV_DATA.food_prices.meal_cost_models.standard.average,
            comfortable: PH_GOV_DATA.food_prices.meal_cost_models.comfortable.average
        };

        const avgPerMeal = mealCostMap[setup] || mealCostMap.standard;
        return mealsPerDay * avgPerMeal * 30;
    },

    calculateCoffeeExpense: function (coffeeHabit) {
        const avgMilkTea = PH_GOV_DATA.eating_out_patterns.milktea.average;
        if (coffeeHabit === 'frequent') return avgMilkTea * 4 * 4;
        if (coffeeHabit === 'weekly') return avgMilkTea * 4;
        return 0;
    },

    getMealTierFromSource: function (mealSource) {
        const map = {
            cook: 'survival',
            canteen: 'budget',
            fastfood: 'comfortable',
            mixed: 'standard'
        };
        return map[mealSource] || 'standard';
    },

    calculateSchoolExpense: function (userData) {
        const userInputTotal = userData.totalSchoolExpenses || 0;
        const schoolLoad = userData.schoolLoad || 'medium';

        if (userInputTotal > 0) return userInputTotal;

        return PH_GOV_DATA.student_benchmarks.school_supplies_monthly[schoolLoad] || 700;
    },

    calculateBudgetAllocation: function (userData) {
        const allowance = userData.monthlyAllowance || 0;
        const actualRent = userData.rent || 0;

        const schoolDays = userData.schoolDaysPerMonth || 22;
        const transportCost = this.calculateTotalTransportCost(userData.transports || [], schoolDays);

        const mealTier = this.getMealTierFromSource(userData.mealSource);
        const baseFoodCost = this.calculateRealisticFoodBudget(userData.mealsPerDay || 3, mealTier);

        const snackExpense = this.calculateSnackExpense(userData);

        const coffeeMonthly = this.calculateCoffeeExpense(userData.coffeeHabit);

        const wifiCost = userData.wifiCost || LOCAL_COSTS.wifi;
        const electricityCost = userData.electricityCost || LOCAL_COSTS.electricity;
        const laundryMonthly = PH_GOV_DATA.utilities.laundry.monthly_estimate;

        const schoolExpenses = this.calculateSchoolExpense(userData);

        const subscriptions = userData.totalSubscriptions || 0;

        const invisibleCostBase = allowance * 0.04;

        const totalFixedCosts = actualRent
            + transportCost.monthly
            + wifiCost
            + electricityCost
            + laundryMonthly
            + schoolExpenses
            + subscriptions
            + coffeeMonthly
            + invisibleCostBase;

        let remainingAfterFixed = allowance - totalFixedCosts;

        const targetEmergency = Math.max(allowance * PH_GOV_DATA.student_benchmarks.recommended_emergency_ratio, 300);
        const emergencyAlloc = Math.max(Math.min(remainingAfterFixed * 0.2, targetEmergency), 0);

        let forFoodAndMisc = remainingAfterFixed - emergencyAlloc;
        const foodAlloc = Math.max(Math.min(forFoodAndMisc, baseFoodCost), 0);

        const discretionary = Math.max(forFoodAndMisc - foodAlloc - snackExpense, 0);

        const dailyLimit = (foodAlloc + discretionary + snackExpense) / 30;

        const rentPercentage = allowance > 0 ? (actualRent / allowance) * 100 : 0;
        const fixedPercentage = allowance > 0 ? (totalFixedCosts / allowance) * 100 : 0;

        const minSurvival = PH_GOV_DATA.student_benchmarks.min_survival_budget;
        const belowSurvivalThreshold = allowance < minSurvival;

        return {
            monthlyAllowance: allowance,
            rent: actualRent,
            rentPercentage,
            transport: transportCost.monthly,
            transportDaily: transportCost.daily,
            snackExpense,
            coffee: coffeeMonthly,
            wifi: wifiCost,
            electricity: electricityCost,
            laundry: laundryMonthly,
            school: schoolExpenses,
            food: foodAlloc,
            utilities: wifiCost + electricityCost + laundryMonthly,
            emergency: emergencyAlloc,
            discretionary,
            invisibleCosts: invisibleCostBase,
            dailyLimit,
            weeklySafe: dailyLimit * 7,
            totalFixedCosts,
            fixedPercentage,
            belowSurvivalThreshold,
            minSurvivalBudget: minSurvival
        };
    },

    getRiskLevel: function (allocation) {
        const { fixedPercentage, dailyLimit, food, belowSurvivalThreshold } = allocation;
        const realisticFood = this.calculateRealisticFoodBudget(3, 'budget');

        if (belowSurvivalThreshold) return 'DANGER';
        if (fixedPercentage > 85) return 'DANGER';
        if (dailyLimit < 120) return 'DANGER';
        if (food < realisticFood * 0.6) return 'DANGER';

        if (fixedPercentage > 70) return 'WARNING';
        if (dailyLimit < 180) return 'WARNING';
        if (food < realisticFood * 0.85) return 'WARNING';
        if (allocation.emergency < 500) return 'WARNING';

        return 'SAFE';
    },

    getRiskMessage: function (riskLevel, allocation) {
        const messages = {
            SAFE: `Budget is healthy. Daily limit of ₱${Math.round(allocation.dailyLimit)} covers your basics with buffer.`,
            WARNING: `Budget is tight. Fixed costs at ${Math.round(allocation.fixedPercentage)}% — watch your daily spending.`,
            DANGER: `CRITICAL: You are at high risk of running out of money. Immediate lifestyle adjustment required.`
        };
        return messages[riskLevel] || messages.SAFE;
    },

    calculateDynamicDailyBudget: function(userData, expenses) {
        const allocation = this.calculateBudgetAllocation(userData);
        const baseDailyLimit = allocation.dailyLimit;

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const schoolDaysPerMonth = userData.schoolDaysPerMonth || 22;

        const calendarDaysPassed = currentDay - 1;
        const schoolDaysPassed = Math.round((calendarDaysPassed / daysInMonth) * schoolDaysPerMonth);

        const remainingSchoolDays = Math.max(1, schoolDaysPerMonth - schoolDaysPassed);

        const addedIncome = (typeof Storage !== 'undefined' && Storage.getTotalIncomeThisMonth)
            ? Storage.getTotalIncomeThisMonth() : 0;

        const totalVariableBudget = (baseDailyLimit * schoolDaysPerMonth) + addedIncome;

        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let totalSpentThisMonth = 0;
        expenses.forEach(exp => {
            const expDate = exp.timestamp
                ? new Date(exp.timestamp).toISOString().split('T')[0]
                : (exp.date || '');
            if (expDate.startsWith(thisMonth)) {
                totalSpentThisMonth += exp.amount;
            }
        });

        let todaySpent = 0;
        expenses.forEach(exp => {
            const expDate = exp.timestamp
                ? new Date(exp.timestamp).toISOString().split('T')[0]
                : (exp.date || '');
            if (expDate === today) {
                todaySpent += exp.amount;
            }
        });

        const remainingPool = Math.max(0, totalVariableBudget - totalSpentThisMonth);

        const remainingAfterToday = Math.max(0, totalVariableBudget - totalSpentThisMonth);
        const remainingDaysAfterToday = Math.max(1, remainingSchoolDays - 1);
        const tomorrowLimit = Math.round(remainingAfterToday / remainingDaysAfterToday);

        const adjustment = tomorrowLimit - Math.round(baseDailyLimit);

        const last7Days = [];
        for (let i = 1; i <= 7; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const dailySpending = {};
        last7Days.forEach(date => { dailySpending[date] = 0; });
        expenses.forEach(exp => {
            const expDate = exp.timestamp
                ? new Date(exp.timestamp).toISOString().split('T')[0]
                : (exp.date || '');
            if (dailySpending.hasOwnProperty(expDate)) {
                dailySpending[expDate] += exp.amount;
            }
        });

        let overspendStreak = 0;
        last7Days.forEach(date => {
            if (dailySpending[date] > baseDailyLimit) overspendStreak++;
        });

        const todayDeviation = todaySpent - baseDailyLimit;

        return {
            baseDailyLimit: Math.round(baseDailyLimit),
            todaySpent: Math.round(todaySpent),
            todayRemaining: Math.round(Math.max(0, baseDailyLimit - todaySpent)),
            tomorrowLimit: tomorrowLimit,
            adjustment: adjustment,
            isOverspentToday: todayDeviation > 0,
            overspendAmount: Math.round(Math.max(0, todayDeviation)),
            remainingPool: Math.round(remainingPool),
            totalVariableBudget: Math.round(totalVariableBudget),
            totalSpentThisMonth: Math.round(totalSpentThisMonth),
            remainingSchoolDays: remainingSchoolDays,
            overspendStreak: overspendStreak,
            allocation: allocation
        };
    },


    generateAdvice: function(allocation, userData) {
        const advice = [];
        const expenses = (typeof Storage !== 'undefined' && Storage.getExpenses) ? Storage.getExpenses() : [];
        const dynamicData = this.calculateDynamicDailyBudget(userData, expenses);

        if (dynamicData.isOverspentToday) {
            if (dynamicData.overspendStreak >= 3) {
                advice.push({
                    type: 'danger',
                    message: `There's a consistent overspending pattern in your recent expenses. You've gone over budget ${dynamicData.overspendStreak} out of the last 7 days. I recommend cutting non-essential spending to avoid long-term budget pressure.`
                });
            } else {
                advice.push({
                    type: 'warning',
                    message: `You went over today's budget by ₱${dynamicData.overspendAmount}. It's manageable, but I've adjusted your tomorrow's budget to ₱${dynamicData.tomorrowLimit} to help balance your weekly spending.`
                });
            }
        } else if (dynamicData.todaySpent > 0 && !dynamicData.isOverspentToday) {
            advice.push({
                type: 'success',
                message: `Good control today. You're staying within your planned limits. This helps maintain a stable budget for the rest of the week.`
            });
        }
        if (dynamicData.adjustment < -10) {
            advice.push({
                type: 'info',
                message: `Based on your recent spending, tomorrow's safe limit has been adjusted to ₱${dynamicData.tomorrowLimit} (₱${Math.abs(dynamicData.adjustment)} less than your base). This is temporary — staying on track will bring it back up.`
            });
        } else if (dynamicData.adjustment > 10) {
            advice.push({
                type: 'success',
                message: `Nice work being disciplined recently. You've built a small surplus, so your tomorrow's budget has a slight boost to ₱${dynamicData.tomorrowLimit}. Keep it up.`
            });
        }
        if (allocation.belowSurvivalThreshold) {
            advice.push({
                type: 'danger',
                message: `Your monthly allowance of ₱${Math.round(allocation.monthlyAllowance)} is below the PSA estimated minimum of ₱${allocation.minSurvivalBudget} for student survival. If possible, consider looking into additional income sources or requesting an allowance adjustment.`
            });
        }
        if (allocation.fixedPercentage > 70) {
            advice.push({
                type: 'danger',
                message: `Your fixed costs are eating ${Math.round(allocation.fixedPercentage)}% of your budget. That leaves very little room for daily needs. PSA recommends keeping fixed costs under 65% — consider renegotiating rent or finding a shared setup.`
            });
        } else if (allocation.fixedPercentage > 55) {
            advice.push({
                type: 'warning',
                message: `Fixed costs are at ${Math.round(allocation.fixedPercentage)}% of your allowance. It's workable, but a single unexpected expense could throw things off. Try to keep some buffer available.`
            });
        }
        if (allocation.rentPercentage > 40) {
            advice.push({
                type: 'warning',
                message: `Rent takes up ${Math.round(allocation.rentPercentage)}% of your income, which is above the recommended 30% ceiling. A bedspace option at around ₱${PH_GOV_DATA.housing.bedspace.average}/month could free up ₱${Math.round(allocation.rent - PH_GOV_DATA.housing.bedspace.average)} for food and essentials.`
            });
        }
        const baseFoodTarget = this.calculateRealisticFoodBudget(userData.mealsPerDay || 3, 'budget');
        if (allocation.food < baseFoodTarget * 0.8) {
            advice.push({
                type: 'warning',
                message: `Your food allocation of ₱${Math.round(allocation.food)} is below what's typically needed for ${userData.mealsPerDay || 3} meals a day based on DA pricing. Cooking your own meals can bring costs down to around ₱40 per meal.`
            });
        }
        if (allocation.snackExpense > allocation.monthlyAllowance * 0.12) {
            advice.push({
                type: 'info',
                message: `Your snack spending comes out to about ₱${Math.round(allocation.snackExpense)} per month — that's ${Math.round((allocation.snackExpense / allocation.monthlyAllowance) * 100)}% of your budget. Even a small cutback here could save you ₱${Math.round(allocation.snackExpense * 0.25)} monthly.`
            });
        }

        if (allocation.coffee > 800) {
            advice.push({
                type: 'info',
                message: `Your coffee or milk tea habit runs about ₱${Math.round(allocation.coffee)} per month. Switching to once a week would save around ₱${Math.round(allocation.coffee - 400)}. That's an extra week of food budget.`
            });
        }
        const hasRideHailing = (userData.transports || []).some(t => t.type === 'ridehailing');
        if (hasRideHailing) {
            advice.push({
                type: 'warning',
                message: `Using ride-hailing apps regularly adds up fast. A single jeepney fare is ₱${PH_GOV_DATA.transport_fares.jeepney.base} versus ₱${PH_GOV_DATA.transport_fares.ride_hailing.bike_base}+ for even a short bike-hailing trip. Switching for daily commutes could save you thousands monthly.`
            });
        }
        if (allocation.emergency < 500) {
            advice.push({
                type: 'danger',
                message: `Your emergency fund is very thin right now. Unexpected expenses for students typically range from ₱800 to ₱1,500 per incident. Even setting aside ₱50 a day helps build a safety net.`
            });
        }

        if (allocation.dailyLimit < 150) {
            advice.push({
                type: 'warning',
                message: `Your daily spending power of ₱${Math.round(allocation.dailyLimit)} is quite tight. Plan meals in advance.`
            });
        }

        return advice;
    },

    simulateScenario: function (params, calibrationOffset = 1) {

        let baseRent = PH_GOV_DATA.housing.shared_room.average;
        if (params.dormType === 'solo') baseRent = PH_GOV_DATA.housing.solo_room.average;
        else if (params.dormType === 'shared') baseRent = PH_GOV_DATA.housing.shared_room.average;
        else if (params.dormType === 'bedspace') baseRent = PH_GOV_DATA.housing.bedspace.average;

        let transportDaily = 0;
        if (params.transport === 'walk')
            transportDaily = 0;
        else if (params.transport === 'jeep')
            transportDaily = PH_GOV_DATA.transport_fares.jeepney.daily_avg;
        else if (params.transport === 'mixed')
            transportDaily = PH_GOV_DATA.transport_fares.jeepney.daily_avg + PH_GOV_DATA.transport_fares.tricycle.daily_avg;
        else if (params.transport === 'ridehailing')
            transportDaily = PH_GOV_DATA.transport_fares.ride_hailing.daily_car_avg;

        if (params.distance > 5 && params.transport !== 'walk') {
            const extraKm = params.distance - 5;
            if (params.transport === 'jeep')
                transportDaily += extraKm * PH_GOV_DATA.transport_fares.jeepney.per_km;
            else if (params.transport === 'ridehailing')
                transportDaily += extraKm * PH_GOV_DATA.transport_fares.ride_hailing.car_per_km;
            else
                transportDaily += extraKm * 4;
        }

        const mealModel = params.meals <= 1 ? 'survival' : params.meals === 2 ? 'budget' : 'standard';
        let foodMonthly = this.calculateRealisticFoodBudget(params.meals, mealModel);

        if (params.snacks === 'high') foodMonthly *= 1.45;
        else if (params.snacks === 'moderate') foodMonthly *= 1.20;

        const coffeeMonthly = this.calculateCoffeeExpense(params.coffee);

        const schoolMonthly = PH_GOV_DATA.student_benchmarks.school_supplies_monthly[params.schoolLoad] || 700;

        const invisibleCosts = params.allowance * 0.04;

        const behaviorDrift = (foodMonthly + (transportDaily * 22) + schoolMonthly) * 0.18;

        const inflationFactor = Math.pow(1 + (params.inflation / 100), 1);

        const totalFixed = (baseRent + (transportDaily * 22) + schoolMonthly + coffeeMonthly + invisibleCosts + behaviorDrift)
            * inflationFactor * calibrationOffset;
        const totalVariable = foodMonthly * inflationFactor * calibrationOffset;
        const totalMonthly = totalFixed + totalVariable;

        const remainingAfterFixed = params.allowance - totalFixed;
        const dailyLimit = Math.max(0, remainingAfterFixed / 30);

        let score = 100;

        const rentRatio = baseRent / params.allowance;
        if (rentRatio > 0.4) score -= 25;
        else if (rentRatio > 0.3) score -= 10;

        if (dailyLimit < 120) score -= 40;
        else if (dailyLimit < 180) score -= 20;

        const surplus = params.allowance - totalMonthly;
        if (surplus < 0) score -= 50;
        else if (surplus < 1000) score -= 20;
        else if (surplus < 2000) score -= 10;

        if (params.allowance < PH_GOV_DATA.student_benchmarks.min_survival_budget) score -= 30;

        score = Math.max(0, Math.min(100, score));

        let interpretation = '';
        if (score > 80)
            interpretation = 'Highly resilient.';
        else if (score > 60)
            interpretation = 'Manageable but tight.';
        else if (score > 40)
            interpretation = `High-risk zone.`;
        else
            interpretation = `Unsustainable.`;

        if (params.inflation > 8)
            interpretation += ` High inflation risk.`;

        if (params.transport === 'ridehailing')
            interpretation += ` High transport costs.`;

        return {
            score,
            dailyLimit,
            totalMonthly,
            totalFixed,
            interpretation,
            invisibleCosts,
            behaviorDrift,
            riskLevel: score < 40 ? 'DANGER' : (score < 65 ? 'WARNING' : 'SAFE')
        };
    }
};
