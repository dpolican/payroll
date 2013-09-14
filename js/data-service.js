/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/11/13
 * Time: 8:19 PM
 * To change this template use File | Settings | File Templates.
 */
function DataService() {
    var db = openDatabase("payroll", "1.0", "Payroll Database", 1024 * 1024);

    db.transaction(function(transaction) {
        transaction.executeSql(
            "CREATE TABLE IF NOT EXISTS socialsecurity(" +
                " bracket INTEGER NOT NULL PRIMARY KEY, " +
                " salary REAL NOT NULL, " +
                " credit REAL NOT NULL, " +
                " employerss REAL NOT NULL, " +
                " employerec REAL NOT NULL, " +
                " employeess REAL NOT NULL);");
    });

    return {
        exec: function(task, successhandler, errorhandler) {
            db.transaction( task, errorhandler, successhandler);
            return false;
        }
    }
}
