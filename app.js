
document.addEventListener('DOMContentLoaded', function() {
    initializeNavbar();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'dashboard.html') {
        UI.loadDashboard();
    } else if (currentPage === 'tracker.html') {
        UI.loadTracker();
    } else if (currentPage === 'index.html' || currentPage === '' || currentPage === 'setup.html') {
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', handleFormSubmit);
        }

        const utilitiesRadios = document.querySelectorAll('input[name="utilitiesIncluded"]');
        const utilitiesSection = document.getElementById('utilitiesSection');
        if (utilitiesRadios.length > 0 && utilitiesSection) {
            utilitiesRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    utilitiesSection.style.display = (this.value === 'yes') ? 'none' : 'grid';
                });
            });
        }
    }
});

function initializeNavbar() {
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function() {
            navbarMenu.classList.toggle('active');
        });

        document.addEventListener('click', function(event) {
            if (!event.target.closest('.navbar')) {
                navbarMenu.classList.remove('active');
            }
        });
    }
}

function nextStep(currentStep) {
    const currentStepDiv = document.getElementById(`step${currentStep}`);
    const inputs = currentStepDiv.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.style.borderColor = 'var(--danger)';
        } else {
            input.style.borderColor = 'var(--border-glass)';
        }
    });

    if (!isValid) {
        alert('Please fill in all required fields before moving to the next step.');
        return;
    }

    currentStepDiv.classList.remove('active');
    document.getElementById(`step${currentStep + 1}`).classList.add('active');

    document.getElementById(`stepIndicator${currentStep}`).classList.remove('active');
    document.getElementById(`stepIndicator${currentStep}`).classList.add('completed');
    document.getElementById(`stepIndicator${currentStep + 1}`).classList.add('active');

    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

function prevStep(currentStep) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep - 1}`).classList.add('active');

    document.getElementById(`stepIndicator${currentStep}`).classList.remove('active');
    document.getElementById(`stepIndicator${currentStep - 1}`).classList.remove('completed');
    document.getElementById(`stepIndicator${currentStep - 1}`).classList.add('active');

    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
}

function addTransport() {
    const transportList = document.getElementById('transportList');
    const newItem = document.createElement('div');
    newItem.className = 'transport-item item';
    newItem.innerHTML = `
        <div style="flex: 1; display: flex; gap: 0.5rem;">
            <select class="transport-type" required style="width: 60%">
                <option value="">Type...</option>
                <option value="walk">Walking</option>
                <option value="jeepney">Jeepney</option>
                <option value="tricycle">Tricycle</option>
                <option value="bus">Bus</option>
                <option value="uv_express">UV Express</option>
                <option value="motorcycle">Gas (Own vehicle)</option>
                <option value="ridehailing">Grab / Joyride</option>
                <option value="other">Other</option>
            </select>
            <input type="number" class="transport-cost" placeholder="Fare" min="0" style="width: 35%">
        </div>
        <div class="trip-type" style="display: flex; gap: 0.5rem; font-size: 0.8rem;">
            <label style="display: flex; align-items: center; gap: 2px;">
                <input type="radio" name="tripType${Date.now()}" value="oneway"> 1-way
            </label>
            <label style="display: flex; align-items: center; gap: 2px;">
                <input type="radio" name="tripType${Date.now()}" value="twoway" checked> 2-way
            </label>
        </div>
        <button type="button" class="btn-small" onclick="removeTransport(this)">DEL</button>
    `;
    transportList.appendChild(newItem);
}

function removeTransport(button) {
    const items = document.querySelectorAll('.transport-item');
    if (items.length > 1) {
        button.closest('.transport-item').remove();
    } else {
        alert('You need at least one transport method (even if it is walking).');
    }
}

function addAllowanceSource() {
    const allowanceList = document.getElementById('allowanceList');
    const newItem = document.createElement('div');
    newItem.className = 'allowance-item item';
    newItem.innerHTML = `
        <div style="flex: 1; display: flex; gap: 0.5rem;">
            <select class="allowance-source" required style="width: 100%">
                <option value="">Source...</option>
                <option value="parents">Parents / Family (Regular)</option>
                <option value="parents_irregular">Parents / Family (Irregular / Delayed)</option>
                <option value="scholarship">Scholarship / Stipend</option>
                <option value="working">Working Student (Own income)</option>
                <option value="mixed">Mixed (Family + Side income)</option>
                <option value="other">Other</option>
            </select>
        </div>
        <button type="button" class="btn-small" onclick="removeAllowanceSource(this)">DEL</button>
    `;
    allowanceList.appendChild(newItem);
}

function removeAllowanceSource(button) {
    const items = document.querySelectorAll('.allowance-item');
    if (items.length > 1) {
        button.closest('.allowance-item').remove();
    } else {
        alert('You need at least one allowance source.');
    }
}

function addSubscription() {
    const subList = document.getElementById('subscriptionList');
    const newItem = document.createElement('div');
    newItem.className = 'subscription-item item';
    newItem.innerHTML = `
        <input type="text" class="sub-name" placeholder="Name (e.g. Canva, Netflix)" style="flex: 2;">
        <input type="number" class="sub-cost" placeholder="Monthly cost" style="flex: 1;">
        <button type="button" class="btn-small" onclick="removeSubscription(this)">DEL</button>
    `;
    subList.appendChild(newItem);
}

function removeSubscription(button) {
    button.closest('.subscription-item').remove();
}

function handleFormSubmit(e) {
    e.preventDefault();

    const allowanceVal = parseFloat(document.getElementById('allowance').value);
    const frequency = document.getElementById('allowanceFrequency').value;
    let monthlyAllowance = allowanceVal;

    if (frequency === 'weekly') {
        monthlyAllowance = allowanceVal * 4.33;
    } else if (frequency === 'daily') {
        monthlyAllowance = allowanceVal * 30;
    }

    const transportItems = document.querySelectorAll('.transport-item');
    const transports = [];

    transportItems.forEach(item => {
        const type = item.querySelector('.transport-type').value;
        const cost = parseFloat(item.querySelector('.transport-cost').value) || 0;
        const tripType = item.querySelector('input[type="radio"]:checked')?.value || 'twoway';

        if (type) {
            transports.push({ type, cost, tripType });
        }
    });

    const subItems = document.querySelectorAll('.subscription-item');
    const subscriptions = [];
    let totalSubscriptions = 0;

    subItems.forEach(item => {
        const nameNode = item.querySelector('.sub-name');
        const costNode = item.querySelector('.sub-cost');
        if (nameNode && costNode) {
            const name = nameNode.value;
            const cost = parseFloat(costNode.value) || 0;
            if (name && cost) {
                subscriptions.push({ name, cost });
                totalSubscriptions += cost;
            }
        }
    });

    const schoolExpenses = {
        orgFees: parseFloat(document.getElementById('schoolOrgFees').value) || 0,
        books: parseFloat(document.getElementById('schoolBooks').value) || 0,
        projects: parseFloat(document.getElementById('schoolProjects').value) || 0,
        other: parseFloat(document.getElementById('schoolOther').value) || 0
    };
    const totalSchoolExpenses = Object.values(schoolExpenses).reduce((a, b) => a + b, 0);

    const allowanceNodes = document.querySelectorAll('.allowance-source');
    const allowanceSources = [];
    allowanceNodes.forEach(node => {
        if (node && node.value) allowanceSources.push(node.value);
    });
    const primaryAllowanceSource = allowanceSources[0] || 'parents';

    const commuteFreq = parseInt(document.getElementById('commuteFrequency')?.value || 5);
    const schoolDaysPerMonth = Math.round(commuteFreq * 4.33);

    const userData = {
        // Identity & Context
        schoolName: document.getElementById('schoolName')?.value || '',
        schoolArea: document.getElementById('schoolArea')?.value || 'metro_manila',
        allowanceSource: primaryAllowanceSource,
        allowanceSources: allowanceSources,

        // Allowance
        monthlyAllowance: monthlyAllowance,
        allowanceType: frequency,
        baseAllowance: allowanceVal,

        livingSetup: document.getElementById('livingSetup').value,
        dormArea: document.getElementById('dormArea')?.value || '',
        rent: parseFloat(document.getElementById('rent').value),
        utilitiesIncluded: document.querySelector('input[name="utilitiesIncluded"]:checked')?.value || 'no',
        wifiCost: parseFloat(document.getElementById('wifiCost').value) || 0,
        electricityCost: parseFloat(document.getElementById('electricityCost').value) || 0,
        waterCost: parseFloat(document.getElementById('waterCost').value) || 0,

        distance: parseFloat(document.getElementById('setupDistance')?.value || 2),
        commuteFrequency: commuteFreq,
        schoolDaysPerMonth: schoolDaysPerMonth,
        transports: transports,

        mealsPerDay: parseInt(document.getElementById('mealsPerDay').value),
        mealSource: document.getElementById('mealSource')?.value || 'canteen',
        snackDailyFrequency: parseInt(document.getElementById('snackDailyFrequency').value),
        snackPriceRange: parseInt(document.getElementById('snackPriceRange').value),
        coffeeHabit: document.getElementById('coffeeHabit')?.value || 'none',
        leakageLevel: parseFloat(document.getElementById('leakageLevel').value),

        schoolLoad: document.getElementById('schoolLoad')?.value || 'medium',
        schoolExpenses: schoolExpenses,
        totalSchoolExpenses: totalSchoolExpenses,
        subscriptions: subscriptions,
        totalSubscriptions: totalSubscriptions,

        timestamp: new Date().toISOString()
    };

    Storage.saveUserData(userData);

    window.location.href = 'dashboard.html';
}

function logExpense() {
    const dateInput = document.getElementById('expenseDate').value;
    const amountInput = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const notes = document.getElementById('expenseNotes').value;

    if (!dateInput || isNaN(amountInput) || amountInput <= 0) {
        showTrackerFeedback("Please enter a valid date and amount.", "danger");
        return;
    }

    const newExpense = {
        id: 'exp_' + Date.now(),
        date: dateInput,
        timestamp: new Date(dateInput).toISOString(),
        amount: amountInput,
        category: category,
        description: notes || category
    };

    Storage.addExpense(newExpense);

    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseNotes').value = '';

    showTrackerFeedback("Transaction logged successfully!", "success");

    if (typeof UI !== 'undefined' && UI.loadTracker) {
        UI.loadTracker();
    }
}

function showTrackerFeedback(msg, type) {
    const feedback = document.getElementById('trackerFeedback');
    if (!feedback) return;

    feedback.innerHTML = `<p style="margin: 0;">${msg}</p>`;
    feedback.style.display = 'flex';
    
    if (type === 'danger') {
        feedback.style.borderLeft = '4px solid var(--danger)';
    } else {
        feedback.style.borderLeft = '4px solid var(--success)';
    }

    setTimeout(() => {
        feedback.style.display = 'none';
    }, 3000);
}

function resetBudget() {
    const confirmation = confirm("WARNING: Are you sure you want to completely reset your budget?\n\nThis will permanently delete all your settings, logged expenses, income records, and transaction history.");
    
    if (confirmation) {
        Storage.clearUserData();
        Storage.clearExpenses();
        Storage.clearIncomes();
        window.location.href = 'setup.html';
    }
}

function goToTracker() {
    window.location.href = 'tracker.html';
}
