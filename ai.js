const AI = {
    getKey: function() { return (window.__ENV && window.__ENV.API_KEY) || ''; },
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    MODEL: 'llama-3.3-70b-versatile',

    analyze: async function(userData, allocation) {
        try {
            const prompt = this.buildAnalysisPrompt(userData, allocation);
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getKey()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        { role: 'system', content: 'You are a financial advisor for Filipino students. Provide practical, actionable financial advice in bullet points. Keep responses concise and focused on student survival.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7, max_tokens: 500
                })
            });
            if (!response.ok) return this.getFallbackAdvice(userData, allocation);
            const data = await response.json();
            return data.choices[0].message.content.split('\n').filter(l => l.trim()).map(l => l.trim());
        } catch (e) {
            return this.getFallbackAdvice(userData, allocation);
        }
    },

    generateWeeklyFoodPlan: async function(userData, limitDaily, budgetRemaining, status) {
        const mealSource = userData.mealSource || 'canteen';
        const area = userData.schoolArea || 'Cavite';

        const mealSourceLabel = {
            cook: 'cooks at home',
            canteen: 'eats at school canteen / karinderya',
            fastfood: 'eats at fast food',
            mixed: 'mixes home cooking and eating out'
        }[mealSource] || 'eats at karinderya';

        const statusGuidance = {
            SAFE:     `Budget is COMFORTABLE. Daily limit ₱${limitDaily}, remaining ₱${Math.round(budgetRemaining)}. Include restaurant or fast food meals (Jollibee, Mang Inasal, Max’s, local eateries) on weekends. Use varied, hearty Filipino viands (adobo, sinigang, kaldereta, lechon kawali).`,
            TIGHT:    `Budget is TIGHT. Daily limit ₱${limitDaily}, remaining ₱${Math.round(budgetRemaining)}. Stick to karinderya and home-cooked meals only. No restaurants. Affordable ulam: sardinas, egg, ginisang gulay, tinola, monggo.`,
            SURVIVAL: `Budget is CRITICAL. Daily limit ₱${limitDaily}, remaining ₱${Math.round(budgetRemaining)}. Absolute cheapest meals: instant noodles, boiled egg, sardinas, cheapest karinderya sets (₱30–50). Skip meals if necessary.`
        }[status];

        const themes = [
            'Comfort Food Classic','Karinderya Special','Healthy Student Meals',
            'Budget Feast','Quick & Easy Meals','Regional Pinoy Flavors',
            'Nutritious & Cheap','Student Favorite Mix','Street Food Inspired'
        ];
        const styles = ['Casual','Instructional','Encouraging','Direct','Creative'];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        const style = styles[Math.floor(Math.random() * styles.length)];
        const seed = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const prompt = `You are a Filipino student meal advisor. 
CURRENT THEME: ${theme}
ADVICE STYLE: ${style}
UNIQUE SESSION ID: ${seed}

Student Context: ${area}, ${mealSourceLabel}.
${statusGuidance}

TASK: Create a brand NEW 7-day meal plan. Do NOT repeat common basic suggestions if possible. Be creative.
Use this EXACT format for each day (no JSON, no markdown, no asterisks):

DAY: Monday
BREAKFAST: meal name (₱XX)
LUNCH: meal name (₱XX)
DINNER: meal name (₱XX)
TIP: short tip

DAY: Tuesday
... and so on for all 7 days.

Important: Realistic prices for ${area}. Use varied Filipino dishes (e.g., Giniling, Bicol Express, Tortang Talong, etc.).`;

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${this.getKey()}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        { role: 'system', content: 'You are a Filipino student meal planner. Provide direct plain-text plans.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.9,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            const rawText = data.choices?.[0]?.message?.content?.trim();
            if (!rawText) return null;

            return this.parseMealPlanText(rawText);
        } catch (err) {
            return null;
        }
    },

    parseMealPlanText: function(text) {
        const dayNames = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        const plan = [];

        for (const dayName of dayNames) {
            const dayRegex = new RegExp(`(?:^|\\n)[^\\n]*(?:DAY[:\s]*)?${dayName}`, 'i');
            const match = dayRegex.exec(text);
            if (!match) continue;

            const startIdx = match.index;
            let endIdx = text.length;
            for (const nextDay of dayNames) {
                if (nextDay === dayName) continue;
                const nextMatch = new RegExp(`(?:^|\\n)[^\\n]*(?:DAY[:\s]*)?${nextDay}`, 'i').exec(text.slice(startIdx + 1));
                if (nextMatch) {
                    const candidate = startIdx + 1 + nextMatch.index;
                    if (candidate < endIdx && candidate > startIdx) endIdx = candidate;
                }
            }

            const block = text.slice(startIdx, endIdx);
            const lines = block.split('\n').map(l => l.trim().replace(/\*\*/g, '').replace(/^[-*#]+\s*/, '')).filter(l => l);

            const getField = (...prefixes) => {
                for (const prefix of prefixes) {
                    const line = lines.find(l => new RegExp(`^${prefix}\\s*:`, 'i').test(l));
                    if (line) {
                        return line.replace(new RegExp(`^${prefix}\\s*:\\s*`, 'i'), '').trim();
                    }
                }
                return '';
            };

            plan.push({
                day:       dayName,
                breakfast: getField('breakfast','morning','am'),
                lunch:     getField('lunch','midday','noon'),
                dinner:    getField('dinner','evening','supper','pm'),
                tip:       getField('tip','note','advice','save')
            });
        }



        return plan.length >= 5 ? plan : null;
    },

    buildAnalysisPrompt: function(userData, allocation) {
        return `As a financial advisor, analyze this student's budget and provide 5-7 specific recommendations:

Monthly Allowance: ₱${Math.round(allocation.monthlyAllowance)}
Rent: ₱${Math.round(allocation.rent)} (${Math.round(allocation.rentPercentage)}% of income)
Food Budget: ₱${Math.round(allocation.food)}
Transport: ₱${Math.round(allocation.transport)}
Snack Expenses: ₱${Math.round(allocation.snackExpense)}
School Expenses: ₱${Math.round(allocation.school)}
Utilities: ₱${Math.round(allocation.utilities)}
Daily Spending Limit: ₱${Math.round(allocation.dailyLimit)}
Emergency Fund: ₱${Math.round(allocation.emergency)}
Living Setup: ${userData.livingSetup}
Meals Per Day: ${userData.mealsPerDay}

Provide specific, actionable advice. Focus on biggest expenses and how to optimize them.`;
    },

    getFallbackAdvice: function(userData, allocation) {
        const advice = [];
        if (allocation.rentPercentage > 45) advice.push(`Rent is ${Math.round(allocation.rentPercentage)}% of income - find cheaper housing`);
        if (allocation.transport > allocation.monthlyAllowance * 0.15) advice.push(`Transport costs ₱${Math.round(allocation.transport)}/month - carpool to save`);
        if (allocation.snackExpense > 500) advice.push(`Snack budget is ₱${Math.round(allocation.snackExpense)}/month - prepare snacks at home`);
        if (allocation.food < 2500) advice.push(`Food budget only ₱${Math.round(allocation.food)}/month - meal prep to save`);
        if (allocation.dailyLimit < 100) advice.push(`Daily limit is only ₱${Math.round(allocation.dailyLimit)} - cut expenses or earn more`);
        if (allocation.emergency < 1000) advice.push(`Emergency fund is low - save at least ₱1,000/month`);
        if (allocation.rentPercentage <= 35 && allocation.dailyLimit > 150) advice.push(`Good budget balance - keep this discipline`);
        return advice.length > 0 ? advice : ['Your budget needs review. Track spending carefully.'];
    },

    predictRisk: function(dailyLimit, dailySpent) {
        const pct = (dailySpent / dailyLimit) * 100;
        if (pct > 100) return { level: 'DANGER', message: `Overspent by ₱${Math.round(dailySpent - dailyLimit)}!` };
        if (pct > 80)  return { level: 'WARNING', message: `Used ${Math.round(pct)}% of daily budget` };
        if (pct > 60)  return { level: 'CAUTION', message: `Spent ₱${Math.round(dailySpent)} of ₱${Math.round(dailyLimit)}` };
        return { level: 'SAFE', message: `On track! Spent ₱${Math.round(dailySpent)}` };
    },

    generateTips: function(allocation) {
        const tips = [];
        if (allocation.rentPercentage > 40) tips.push("Consider shared accommodation to cut rent");
        if (allocation.transport > 3000) tips.push("Carpool or use bikes to save on transport");
        if (allocation.food > 3500) tips.push("Pack lunch from home instead of buying");
        if (allocation.school > 1500) tips.push("Use university resources and e-books");
        tips.push("Track every expense to find spending leaks");
        tips.push("Look for student discounts on transport");
        return tips;
    }
};
