const Storage = {
    KEYS: {
        USER_DATA: 'studentOS_userData',
        EXPENSES: 'studentOS_expenses',
        INCOMES: 'studentOS_incomes'
    },

    saveUserData: function(data) {
        localStorage.setItem(this.KEYS.USER_DATA, JSON.stringify(data));
    },

    getUserData: function() {
        try {
            const data = localStorage.getItem(this.KEYS.USER_DATA);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error("error user data reset", e);
            this.clearUserData();
            return null;
        }
    },

    clearUserData: function() {
        localStorage.removeItem(this.KEYS.USER_DATA);
        localStorage.removeItem(this.KEYS.EXPENSES);
        localStorage.removeItem(this.KEYS.INCOMES);
    },

    addExpense: function(exp) {
        let exps = this.getExpenses();
        exps.push(exp);
        localStorage.setItem(this.KEYS.EXPENSES, JSON.stringify(exps));
    },

    getExpenses: function() {
        try {
            const res = localStorage.getItem(this.KEYS.EXPENSES);
            return res ? JSON.parse(res) : [];
        } catch (e) {
            console.error("error expense data", e);
            this.clearExpenses();
            return [];
        }
    },

    getTodayExpenses: function() {
        const d = new Date().toISOString().split('T')[0];
        return this.getExpenses().filter(x => x.date === d);
    },

    removeExpense: function(id) {
        const exps = this.getExpenses().filter(x => x.id !== id);
        localStorage.setItem(this.KEYS.EXPENSES, JSON.stringify(exps));
    },

    clearExpenses: function() {
        localStorage.removeItem(this.KEYS.EXPENSES);
    },

    addIncome: function(inc) {
        let incs = this.getIncomes();
        incs.push(inc);
        localStorage.setItem(this.KEYS.INCOMES, JSON.stringify(incs));
    },

    getIncomes: function() {
        try {
            const res = localStorage.getItem(this.KEYS.INCOMES);
            return res ? JSON.parse(res) : [];
        } catch (e) {
            console.error("error income data", e);
            localStorage.removeItem(this.KEYS.INCOMES);
            return [];
        }
    },

    getTotalIncomeThisMonth: function() {
        const d = new Date();
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return this.getIncomes()
            .filter(x => (x.date || '').startsWith(m))
            .reduce((s, x) => s + (x.amount || 0), 0);
    },

    clearIncomes: function() {
        localStorage.removeItem(this.KEYS.INCOMES);
    }
};
