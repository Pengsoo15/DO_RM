const UI = {
    loadDashboard: function() {
        const userData = Storage.getUserData();
        if (!userData) { window.location.href = 'setup.html'; return; }

        const allocation = BudgetEngine.calculateBudgetAllocation(userData);
        const expenses   = Storage.getExpenses();
        const dynamic    = BudgetEngine.calculateDynamicDailyBudget(userData, expenses);

        const addedInc = Storage.getTotalIncomeThisMonth();
        const fullBudget    = userData.monthlyAllowance + addedInc;
        const remaining  = Math.max(0, fullBudget - dynamic.totalSpentThisMonth);
        const ratio = fullBudget > 0 ? remaining / fullBudget : 0;

        let rate = 'SAFE';
        if (ratio < 0.20) rate = 'SURVIVAL';
        else if (ratio < 0.50) rate = 'TIGHT';

        const ob = document.getElementById('overallBudget');
        if (ob) ob.textContent = `₱${Math.round(fullBudget).toLocaleString()}`;

        const obBar = document.getElementById('overallBar');
        if (obBar) obBar.style.width = '100%';

        const rb = document.getElementById('remainingBudget');
        if (rb) rb.textContent = `₱${Math.round(remaining).toLocaleString()}`;

        const remainPct = fullBudget > 0 ? Math.min((remaining / fullBudget) * 100, 100) : 0;
        const rbBar = document.getElementById('remainingBar');
        if (rbBar) {
            rbBar.style.width = `${remainPct}%`;
            rbBar.style.background = rate === 'SAFE' ? 'var(--success)' : rate === 'TIGHT' ? 'var(--warning)' : 'var(--danger)';
        }

        const msgs = {
            SAFE:     'Budget is stable.',
            TIGHT:    'Budget is limited — needs caution.',
            SURVIVAL: 'High risk of running out of money.'
        };
        const rbBlock = document.getElementById('ratingBlock');
        if (rbBlock) {
            rbBlock.textContent = rate;
            rbBlock.className = `rating-label-block rating-${rate}-block`;
        }
        const rbDesc = document.getElementById('ratingDescription');
        if (rbDesc) rbDesc.textContent = msgs[rate];

        const advMsgs = {
            SAFE:     `You're managing your budget well so far. To stay on track, try limiting snack spending this week and focus on planned meals. Keep this discipline and you'll finish the month comfortably.`,
            TIGHT:    `Your budget is getting limited. Every purchase counts now. Prioritize home-cooked or karinderya meals and avoid drinks outside to save ₱300–₱500 this week. Check the Weekly Plan for a full survival guide.`,
            SURVIVAL: `Your budget is critically low. Avoid all non-essential spending immediately. Focus on the cheapest food options and minimize transportation costs. Reach out for support if needed.`
        };
        const adv = document.getElementById('advisorMessage');
        if (adv) {
            adv.textContent = advMsgs[rate];
            const advCard = adv.closest('.advisor-card');
            if (advCard) {
                if (rate === 'SAFE') advCard.style.borderLeftColor = 'var(--success)';
                else if (rate === 'TIGHT') advCard.style.borderLeftColor = 'var(--warning)';
                else advCard.style.borderLeftColor = 'var(--danger)';
            }
        }

        const oFixed = allocation.utilities + allocation.school + (userData.totalSubscriptions || 0);
        const rnt = document.getElementById('allocRent');
        const fd = document.getElementById('allocFood');
        const trnsp = document.getElementById('allocTransport');
        const othrs = document.getElementById('allocFixedOthers');
        const sncks = document.getElementById('allocSnacks');
        const totFixed = document.getElementById('totalFixed');

        if (rnt) rnt.textContent = `₱${Math.round(allocation.rent).toLocaleString()}`;
        if (fd) fd.textContent = `₱${Math.round(allocation.food).toLocaleString()}`;
        if (trnsp) trnsp.textContent = `₱${Math.round(allocation.transport).toLocaleString()}`;
        if (othrs) othrs.textContent = `₱${Math.round(oFixed).toLocaleString()}`;
        if (sncks) sncks.textContent = `₱${Math.round(allocation.snackExpense).toLocaleString()}`;
        if (totFixed) totFixed.textContent = `₱${Math.round(allocation.totalFixedCosts).toLocaleString()}`;

        const advList = BudgetEngine.generateAdvice(allocation, userData);
        const list = document.getElementById('aiInsights');
        if (list) {
            list.innerHTML = '';
            advList.slice(0, 5).forEach(item => {
                const div = document.createElement('div');
                const bc = {
                    danger: 'var(--danger)',
                    warning: 'var(--warning)',
                    success: 'var(--success)',
                    info: 'var(--accent)'
                }[item.type] || 'var(--border-glass)';
                div.className = 'advice-item';
                div.style.borderLeftColor = bc;
                div.textContent = item.message;
                list.appendChild(div);
            });
        }

        const actLimit = dynamic.remainingSchoolDays > 0
            ? Math.round(remaining / dynamic.remainingSchoolDays)
            : dynamic.baseDailyLimit;

        const dd = document.getElementById('dashDailyLimit');
        const ds = document.getElementById('dashSpentToday');
        const dl = document.getElementById('dashRemainingToday');
        const dt = document.getElementById('dashTomorrowLimit');

        if (dd) dd.textContent = `₱${actLimit.toLocaleString()}`;
        if (ds) ds.textContent = `₱${dynamic.todaySpent.toLocaleString()}`;
        if (dl) dl.textContent = `₱${Math.max(0, actLimit - dynamic.todaySpent).toLocaleString()}`;
        if (dt) dt.textContent = `₱${dynamic.tomorrowLimit.toLocaleString()}`;

        if (adv && rate === 'SAFE') {
            adv.textContent = `You're managing your budget well. Your actual daily budget is ₱${actLimit.toLocaleString()} based on ₱${Math.round(remaining).toLocaleString()} remaining over ${dynamic.remainingSchoolDays} school days. You can allow some flexibility this week — occasional restaurant meals are fine. Keep tracking to stay on pace.`;
        }
    },

    loadTracker: function() {
        const userData = Storage.getUserData();
        if (!userData) { window.location.href = 'setup.html'; return; }

        const expenses = Storage.getExpenses();
        const dynamic  = BudgetEngine.calculateDynamicDailyBudget(userData, expenses);

        const addedInc = Storage.getTotalIncomeThisMonth();
        const fullBudget = userData.monthlyAllowance + addedInc;
        const remaining = Math.max(0, fullBudget - dynamic.totalSpentThisMonth);
        const ratio = fullBudget > 0 ? remaining / fullBudget : 0;

        let rate = 'SAFE';
        if (ratio < 0.20) rate = 'SURVIVAL';
        else if (ratio < 0.50) rate = 'TIGHT';

        const actLimit = dynamic.remainingSchoolDays > 0
            ? Math.round(remaining / dynamic.remainingSchoolDays)
            : dynamic.baseDailyLimit;

        const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        set('trackerOverallBudget',   `₱${Math.round(fullBudget).toLocaleString()}`);
        set('trackerRemainingBudget', `₱${Math.round(remaining).toLocaleString()}`);
        set('trackerDailyLimit',      `₱${actLimit.toLocaleString()}`);
        set('trackerSpent',           `₱${dynamic.todaySpent.toLocaleString()}`);
        set('trackerRemaining',       `₱${Math.max(0, actLimit - dynamic.todaySpent).toLocaleString()}`);

        const pill = document.getElementById('trackerRatingPill');
        if (pill) { pill.textContent = rate; pill.className = `rating-pill ${rate}`; }

        const adv = document.getElementById('trackerAdvisorMsg');
        if (adv) {
            const poolLeft  = dynamic.remainingPool;
            const daysLeft  = dynamic.remainingSchoolDays;

            let m = '';
            let bc = 'var(--accent)';

            if (dynamic.isOverspentToday) {
                if (dynamic.overspendStreak >= 3) {
                    m = `There's a consistent overspending pattern across your last 7 days. Your actual daily budget is ₱${actLimit.toLocaleString()} based on ₱${Math.round(remaining).toLocaleString()} remaining. I recommend cutting non-essential spending now.`;
                    bc = 'var(--danger)';
                } else {
                    m = `You went over today's limit by ₱${dynamic.overspendAmount}. Your actual daily limit is ₱${actLimit.toLocaleString()} based on ₱${Math.round(remaining).toLocaleString()} remaining over ${dynamic.remainingSchoolDays} school days.`;
                    bc = 'var(--warning)';
                }
            } else if (dynamic.todaySpent > 0) {
                const pct = Math.round((dynamic.todaySpent / actLimit) * 100);
                if (pct > 80) {
                    m = `You've used ${pct}% of today's ₱${actLimit.toLocaleString()} limit. ₱${Math.round(remaining).toLocaleString()} remains for the next ${dynamic.remainingSchoolDays} school days. Stay careful.`;
                    bc = 'var(--warning)';
                } else {
                    m = `Good control today. You have ₱${Math.round(remaining).toLocaleString()} left for ${dynamic.remainingSchoolDays} more school days this month (₱${actLimit.toLocaleString()}/day).`;
                    bc = 'var(--success)';
                }
            } else {
                m = `No spending recorded today. Your current daily limit is ₱${actLimit.toLocaleString()} based on ₱${Math.round(remaining).toLocaleString()} remaining for ${dynamic.remainingSchoolDays} school days.`;
            }

            if (rate === 'SURVIVAL' && !dynamic.isOverspentToday) {
                m = `You're in Survival mode. Your budget is critically low — ₱${Math.round(remaining).toLocaleString()} remaining. Your daily limit is only ₱${actLimit.toLocaleString()}. Avoid all non-essential spending.`;
                bc = 'var(--danger)';
            } else if (rate === 'TIGHT' && !dynamic.isOverspentToday && dynamic.todaySpent === 0) {
                m = `Your budget is tight. Current daily limit is ₱${actLimit.toLocaleString()} — stick to karinderya meals and avoid unnecessary purchases today.`;
                bc = 'var(--warning)';
            }

            adv.textContent = m;
            const fc = adv.parentElement;
            if (fc) fc.style.borderLeft = `4px solid ${bc}`;
        }

        this.renderExpenseHistory(expenses);
        this.renderHeatmap(expenses);
    },

    renderHeatmap: function(expenses) {
        const grid = document.getElementById('heatmapGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const now   = new Date();
        const year  = now.getFullYear();
        const month = now.getMonth();

        const daysInMonth    = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        // Group expenses by date
        const dailyTotals = {};
        expenses.forEach(exp => {
            const expDate = new Date(exp.timestamp);
            if (expDate.getFullYear() === year && expDate.getMonth() === month) {
                const dateStr = expDate.toISOString().split('T')[0];
                dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + exp.amount;
            }
        });

        let maxExpense = 0;
        for (let date in dailyTotals) {
            if (dailyTotals[date] > maxExpense) maxExpense = dailyTotals[date];
        }

        // Padding cells
        for (let i = 0; i < firstDayOfWeek; i++) {
            const empty = document.createElement('div');
            empty.style.cssText = 'background:transparent;border:none;';
            grid.appendChild(empty);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const totalSpent = dailyTotals[dateStr] || 0;

            let tier = 0;
            if (totalSpent > 0 && maxExpense > 0) {
                const ratio = totalSpent / maxExpense;
                if (ratio > 0.75) tier = 4;
                else if (ratio > 0.5) tier = 3;
                else if (ratio > 0.25) tier = 2;
                else tier = 1;
            }

            const cell = document.createElement('div');
            cell.className = `heatmap-cell heat-${tier}`;
            cell.textContent = day;
            cell.setAttribute('data-tooltip', `${dateStr}: ${totalSpent > 0 ? '₱' + totalSpent.toLocaleString() : 'No expense'}`);
            grid.appendChild(cell);
        }
    },

    renderExpenseHistory: function(expenses) {
        const list = document.getElementById('expenseList');
        if (!list) return;
        list.innerHTML = '';

        if (!expenses.length) {
            list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No expenses recorded yet.</p>';
            return;
        }

        [...expenses].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(exp => {
                const item = document.createElement('div');
                item.className = 'expense-item-row';
                item.innerHTML = `
                    <div style="display:flex;flex-direction:column;gap:0.2rem;">
                        <div style="font-weight:600;font-size:0.9rem;">${exp.description || exp.category}</div>
                        <div style="display:flex;gap:0.5rem;align-items:center;">
                            <span class="expense-cat-tag">${exp.category}</span>
                            <span style="font-size:0.75rem;color:var(--text-muted);">${this.formatDate(exp.timestamp)}</span>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <span style="font-weight:700;color:var(--secondary);">₱${exp.amount.toLocaleString()}</span>
                        <button class="delete-btn" onclick="deleteExpense('${exp.id}')" title="Delete">✕</button>
                    </div>
                `;
                list.appendChild(item);
            });
    },

    formatDate: function(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

function deleteExpense(id) {
    if (!confirm('Remove this expense?')) return;
    Storage.removeExpense(id);
    if (typeof UI !== 'undefined' && UI.loadTracker) UI.loadTracker();
}

function goToDashboard() { window.location.href = 'dashboard.html'; }
