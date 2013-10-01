/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/11/13
 * Time: 8:19 PM
 * To change this template use File | Settings | File Templates.
 */
function DataService() {
    var db = openDatabase("payroll", "1.0", "Payroll Database", 1024 * 1024);

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

    var generalSetupTable = {
        tableName: 'payroll_setup',
        id: 'id',
        paydayWeekday: 'payday_weekday',
        amIn: 'am_in',
        amOut: 'am_out',
        pmIn: 'pm_in',
        pmOut: 'pm_out',
        regularHours: 'regular_hours',
        paySchedule: 'pay_schedule',
        incentivePay: 'incentive_pay',
        sundayIncentive: 'sunday_incentive',
        overtimeFactor: 'overtime_factor',
        legalHolidayFactor: 'legal_holiday_factor',
        specialHolidayFactor: 'special_holiday_factor',
        sickDays: 'sick_days',
        vacationDays: 'vacation_days'
    };

    var storeTable = {
        tableName: 'store',
        id: 'id',
        name: 'name',
        address: 'address'
    };

    var init = function() {

    };

        db.transaction(function(transaction) {
            transaction.executeSql(
                "CREATE TABLE IF NOT EXISTS social_security(" +
                    " bracket INTEGER NOT NULL PRIMARY KEY, " +
                    " salary REAL NOT NULL, " +
                    " credit REAL NOT NULL, " +
                    " employer_ss REAL NOT NULL, " +
                    " employer_ec REAL NOT NULL, " +
                    " employee_ss REAL NOT NULL);");

            transaction.executeSql(
                "CREATE TABLE IF NOT EXISTS " + generalSetupTable.tableName + " ( " +
                    generalSetupTable.id + " INTEGER NOT NULL PRIMARY KEY, " +
                    generalSetupTable.paydayWeekday + " INTEGER NOT NULL, " +
                    generalSetupTable.amIn + " TEXT NOT NULL, " +
                    generalSetupTable.amOut + " TEXT NOT NULL, " +
                    generalSetupTable.pmIn + " TEXT NOT NULL, " +
                    generalSetupTable.pmOut + " TEXT NOT NULL, " +
                    generalSetupTable.regularHours + " REAL NOT NULL, " +
                    generalSetupTable.paySchedule + " INTEGER NOT NULL, " +
                    generalSetupTable.incentivePay + " REAL NOT NULL, " +
                    generalSetupTable.sundayIncentive + " REAL NOT NULL, " +
                    generalSetupTable.overtimeFactor + " REAL NOT NULL, " +
                    generalSetupTable.legalHolidayFactor + " REAL NOT NULL, " +
                    generalSetupTable.specialHolidayFactor + " REAL NOT NULL, " +
                    generalSetupTable.sickDays + " REAL NOT NULL, " +
                    generalSetupTable.vacationDays + " REAL NOT NULL);");

            transaction.executeSql(
            "CREATE TABLE IF NOT EXISTS " + storeTable.tableName + "(" +
                storeTable.id + " INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, " +
                storeTable.name + " TEXT NOT NULL, " +
                storeTable.address + " TEXT NOT NULL);");
    });

    return {
        generalSetupTable: generalSetupTable,
        storeTable: storeTable,
        exec: function(task, successhandler, errorhandler) {
            db.transaction( task, errorhandler, successhandler);
            return false;
        },

        storeDB: storeDB,
        withholdingTypeDB: withholdingTypeDB,
        medicareDB: medicareDB,
        init: init
    }
}
