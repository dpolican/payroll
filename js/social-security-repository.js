/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/5/13
 * Time: 6:53 AM
 * To change this template use File | Settings | File Templates.
 */
function SocialSecurityRepository(DataService, $q) {

    var socialSecurityRecords = [];

    var getAll = function() {
        var errorOccurred = false;

        var delay = $q.defer();

        var errorHandler = function(transaction, error) {
            errorOccurred = true;
            delay.reject('Error retrieving social security records Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };

        DataService.exec(function (transaction) {
            transaction.executeSql(
                "SELECT * from socialsecurity order by bracket;", [], function (transaction, result) {
                    var records = [];
                    for (var i = 0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var record = {};
                        record.bracket = row.bracket;
                        record.salary = row.salary;
                        record.credit = row.credit;
                        record.employerSS = row.employerss;
                        record.employerEC = row.employerec;
                        record.employeeSS = row.employeess;
                        records.push(record);
                    }

                    socialSecurityRecords = angular.copy(records);
                    delay.resolve(records);
                }, errorHandler
            );
        });

        return delay.promise;
    };


    var saveAll = function(updatedRecords) {
        var recordsToSave = updatedRecords;
        var newRecords = [];
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(transaction, error) {
            alert('Error saving social security records Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            ids.push(recordToSave.bracket);
            var existingRecord = false;
            for (var j = 0; j < socialSecurityRecords.length; j++) {
                var socialSecurityRecord = socialSecurityRecords[j];
                if (recordToSave.bracket == socialSecurityRecord.bracket) {
                    existingRecord = true;
                    if (!angular.equals(recordToSave, socialSecurityRecord)) {
                        var updateFunction = function(recordToSave) {
                            return function(transaction) {
                                transaction.executeSql(
                                    "update socialsecurity set salary = ?, credit = ?, employerss = ?, employerec = ?, employeess = ? where bracket = ?;",
                                    [recordToSave.salary, recordToSave.credit, recordToSave.employerSS, recordToSave.employerEC, recordToSave.employeeSS, recordToSave.bracket],
                                    function() {  },
                                    errorHandler
                                );
                            }
                        };

                        DataService.exec(updateFunction(recordToSave));
                    }
                    break;
                }
            }
            if (!existingRecord) {
                newRecords.push(recordToSave);
            }
        };

        angular.forEach(newRecords, function(newRecord, index) {
            var insertFunction = function(newRecord) {
                return function(transaction) {
                    transaction.executeSql(
                        "insert into socialsecurity (bracket, salary, credit, employerss, employerec, employeess) values(?, ?, ?, ?, ?, ?);",
                        [newRecord.bracket, newRecord.salary, newRecord.credit, newRecord.employerSS, newRecord.employerEC, newRecord.employeeSS],
                        function() {},
                        errorHandler
                    )
                }
            };

            DataService.exec(insertFunction(newRecord));
        });

        angular.forEach(socialSecurityRecords, function(socialSecurityRecord, index) {
            if (ids.indexOf(socialSecurityRecord.bracket) < 0) {
                var deleteFunction = function(socialSecurityRecord) {
                    return function(transaction) {
                        transaction.executeSql(
                            "delete from socialsecurity where bracket = ?;",
                            [socialSecurityRecord.bracket],
                            function() {},
                            errorHandler
                        );
                    }
                };
                DataService.exec(deleteFunction(socialSecurityRecord));
            }
        });

        socialSecurityRecords = angular.copy(updatedRecords);
    };

    var newRecord = function() {
        return { bracket: '', salary: 0, credit: 0, employerSS: 0, employerEC: 0, employeeSS: 0 };
    };

    return {
        getAll: getAll,
        saveAll: saveAll,
        newRecord: newRecord
    }
}
