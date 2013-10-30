/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/11/13
 * Time: 8:19 PM
 * To change this template use File | Settings | File Templates.
 */
function DataService() {
    var employeeDbReady;

    var payrollDB = new IDBStore({
        dbVersion: 1,
        storeName: 'payroll',
        keyPath: 'id',
        autoIncrement: true,
        onStoreReady: function(){
            console.log("Payroll DB ready.");
        }
    });

    var storeDB = new IDBStore({
        dbVersion: 1,
        storeName: 'store',
        keyPath: 'id',
        autoIncrement: true,
        onStoreReady: function(){
            console.log("Store DB ready.");
        }
    });

    var withholdingTypeDB = new IDBStore({
        dbVersion: 1,
        storeName: 'wh-type',
        keyPath: 'id',
        autoIncrement: true,
        onStoreReady: function(){
            console.log("Withholding Type DB ready.");
        }
    });

    var medicareDB = new IDBStore({
        dbVersion: 1,
        storeName: 'medicare',
        keyPath: 'id',
        autoIncrement: true,
        onStoreReady: function(){
            console.log("Medicare DB ready.");
        }
    });

    var withholdingDB = new IDBStore({
        dbVersion: 1,
        storeName: 'withholding',
        keyPath: 'id',
        autoIncrement: true,
        onStoreReady: function(){
            console.log("Withholding DB ready.");
        }
    });

    var employeeDB = new IDBStore({
        dbVersion: 1,
        storeName: 'employee',
        keyPath: 'id',
        autoIncrement: true,
        onStoreReady: function(){
            console.log("Employee DB ready.");
            employeeDbReady = true;
        }
    });

    var socialSecurityDB = new IDBStore({
        dbVersion: 1,
        storeName: 'social-security',
        keyPath: 'bracket',
        autoIncrement: true,
        onStoreReady: function(){
            console.log("Social Security DB ready.");
        }
    });

    return {
        storeDB: storeDB,
        withholdingTypeDB: withholdingTypeDB,
        medicareDB: medicareDB,
        withholdingDB: withholdingDB,
        employeeDB: employeeDB,
        payrollDB: payrollDB,
        socialSecurityDB: socialSecurityDB,
        employeeDbReady: function() { return employeeDbReady; },
        init: function() { }
    }
}
