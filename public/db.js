let db;
let budgetVersion;

const request = indexedDB.open('budget', budgetVersion || 1);

request.onupgradeneeded = function (e) {
    console.log('Upgrade needed in IndexDB');

    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    console.log(`DB updated from ${oldVersion} to ${newVersion}`);

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('BudgetStore', { autoIncrement: true });
    }
};

request.onerror = function (e) {
    console.log(`Whoops! Something went wrong. ${e.target.errorCode}`);
};

function checkDatabase() {
    console.log('check db invoked');

    let transaction = db.transaction(['BudgetStore'], 'readwrite');

    const store = transaction.objectStore('BudgetStore');

    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    if (res.length !== 0) {
                        transaction = db.transaction(['BudgetStore'], 'readwrite');

                        const currentStore = transaction.objectStore('BudgetStore');

                        currentStore.clear();
                        console.log('Clearing the store');
                    }
                });
        }
    };
};

request.onsuccess = function (e) {
    console.log('Success!');
    db = e.target.result;

    if (navigator.onLine) {
        console.log('Backend online!');
        checkDatabase();
    }
};

const saveRecord = (record) => {
    console.log('Save record invoked.');

    const transaction = db.transaction(['BudgetStore'], 'readwrite');

    const store = transaction.objectStore('BudgetStore');

    store.add(record);
};

window.addEventListener('online', checkDatabase);