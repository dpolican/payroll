/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/5/13
 * Time: 6:45 AM
 * To change this template use File | Settings | File Templates.
 */
function SocialSecurityController($scope, $rootScope, dialog, SocialSecurityRepository) {

    $scope.records = [];

    $scope.gridOptions = {
        data: 'records',
        enableCellEditOnFocus: true,
        enableCellSelection: true,
        enableRowSelection: false,
        enableSorting: false,
        columnDefs: [
            {field:'bracket', displayName:'Bracket', cellFilter: 'number', width: 68, enableCellEdit: false },
            {field:'salary', displayName:'Salary', cellFilter: 'currency'},
            {field:'credit', displayName:'Credit', cellFilter: 'currency'},
            {field:'employerSS', displayName:'Employer SS', cellFilter: 'currency'},
            {field:'employerEC', displayName:'Employer EC', cellFilter: 'currency'},
            {field:'employeeSS', displayName:'Employee SS', cellFilter: 'currency'}
        ]
    };

    SocialSecurityRepository.getAll()
        .then(function(result){
            $scope.records = result;
        }, function() { alert("Error loading Social Security records.")});

    $scope.saveSSS = function() {
        SocialSecurityRepository.saveAll($scope.records, function() {
            $rootScope.$broadcast(PayrollConstants.socialSecurityUpdatedEvent);
        });
        dialog.close();
    };

    $scope.cancelSSS = function () {
        dialog.close();
    };

    $scope.addRow = function() {
        var newrecord = SocialSecurityRepository.newRecord();
        newrecord.bracket = $scope.determineNextBracket();
       $scope.records.push(newrecord);
    };

    $scope.deleteRow = function() {
        var rows = $scope.records.length;
        if (rows > 0) {
            $scope.records.splice(rows - 1, 1);
        }
    }

    $scope.determineNextBracket = function () {
        var max = 0;

        for (var i = 0; i < $scope.records.length; i++)
        {
            if (max < $scope.records[i].bracket)
            {
                max = $scope.records[i].bracket;
            }
        }

        return 1 + max;
    };
};

function SocialSecurityRepository(DataService, $q, $rootScope) {

    var socialSecurityRecords;

    var getAll = function() {
        var errorOccurred = false;

        var delay = $q.defer();

        var errorHandler = function(transaction, error) {
            errorOccurred = true;
            delay.reject('Error retrieving social security records Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };

        if (socialSecurityRecords) {
            delay.resolve(angular.copy(socialSecurityRecords));
        } else {
            DataService.exec(function (transaction) {
                transaction.executeSql(
                    "SELECT * from social_security order by bracket;", [], function (transaction, result) {
                        var records = [];
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            var record = {};
                            record.bracket = row.bracket;
                            record.salary = row.salary;
                            record.credit = row.credit;
                            record.employerSS = row.employer_ss;
                            record.employerEC = row.employer_ec;
                            record.employeeSS = row.employee_ss;
                            records.push(record);
                        }

                        socialSecurityRecords = angular.copy(records);
                        delay.resolve(records);
                        $rootScope.$apply();
                    }, errorHandler
                );
            });
        }

        return delay.promise;
    };


    var saveAll = function(updatedRecords, successHandler) {
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
                                    "update social_security set salary = ?, credit = ?, employer_ss = ?, employer_ec = ?, employee_ss = ? where bracket = ?;",
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
                        "insert into social_security (bracket, salary, credit, employer_ss, employer_ec, employee_ss) values(?, ?, ?, ?, ?, ?);",
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
                            "delete from social_security where bracket = ?;",
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

        if (successHandler) {
            successHandler();
        }
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

