/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/5/13
 * Time: 8:13 AM
 * To change this template use File | Settings | File Templates.
 */
var GeneralSetupController = function($scope, $rootScope, dialog, GeneralSetupRepository) {
    $scope.data = {};

    GeneralSetupRepository.getData()
        .then(function(result){
            $scope.data = result;
        }, function() { alert("Error loading General Setup data.")});


    $scope.cancelSetup = function() {
        dialog.close();
    };
    $scope.saveSetup = function() {
        GeneralSetupRepository.saveData($scope.data, function() {
            $rootScope.$broadcast(PayrollConstants.generalSetupUpdatedEvent);
        });
        dialog.close();
    };
};

function GeneralSetupRepository(DataService, $q, $rootScope) {
    var data;

    var defaultData = { id: 0, paydayWeekday: PayrollConstants.weekdays[6],
        amIn: '08:00', amOut: '12:00', pmIn: '13:00', pmOut: '18:00',
        regularHours: 8.0, paySchedule: 'Weekly', incentivePay: 50.0, sundayIncentive: 75.0,
        overtimeFactor: 1.5, legalHolidayFactor: 1.5, specialHolidayFactor: 2.0,
        sickDays: 5, vacationDays: 5
    };

    var convertToWeekdayString = function(index) {
        if (index > -1 && index < PayrollConstants.weekdays.length) {
            return PayrollConstants.weekdays[index];
        }
        return null;
    }
    var getWeekdayIndex = function(weekday) {
        return PayrollConstants.weekdays.indexOf(weekday);
    }
    var convertToPayScheduleString = function(index) {
        if (index > -1 && index < PayrollConstants.paySchedule.length) {
            return PayrollConstants.paySchedule[index];
        }
        return PayrollConstants.paySchedule[0];
    }

    var getPayScheduleIndex = function(paySchedule) {
        return PayrollConstants.paySchedule.indexOf(paySchedule);
    }

    var convertTimeToNumber = function(hourstring) {
        if (hourString && hourstring.length > 0) {
            var indexOfSeparator = hourstring.indexOf(':');
            if (indexOfSeparator == -1) {
                indexOfSeparator = hourstring.indexOf('.');
            }
            var hourPart = hourstring.substr(0, indexOfSeparator);
            var minutePart = hourstring(indexOfSeparator + 1, hourstring.length);
            if (hourPart.indexOf('0') == 0) {
                hourPart = hourPart.substr(1);
            }
            if (minutePart.indexOf('0') == 0) {
                minutePart = minutePart.substr(1);
            }
        }
    }

    var getData = function() {
        var errorOccurred = false;

        var delay = $q.defer();

        var successHandler = function (result) {
            if (result.length > 0) {
                data = angular.copy(result[0]);
                delay.resolve(result[0]);
            }
            else
            {
                data = angular.copy(defaultData);
                delay.resolve(angular.copy(defaultData));
            }

            $rootScope.$apply();
        };

        var errorHandler = function(transaction, error) {
            errorOccurred = true;
            delay.reject('Error retrieving general setup data. Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };

        if (data) {
            delay.resolve(data);
        } else {
            DataService.payrollDB.getAll(successHandler, errorHandler);
            /*
            DataService.exec(function (transaction) {
                transaction.executeSql(
                    "SELECT * from " + DataService.generalSetupTable.tableName + " where " + DataService.generalSetupTable.id + " = ?", [1], function (transaction, result) {
                        var record = defaultData;
                        if (result.rows.length > 0) {
                            var row = result.rows.item(0);
                            record.id = row[DataService.generalSetupTable.id];
                            record.paydayWeekday = convertToWeekdayString(row[DataService.generalSetupTable.paydayWeekday]);
                            record.amIn = row[DataService.generalSetupTable.amIn];
                            record.amOut = row[DataService.generalSetupTable.amOut];
                            record.pmIn = row[DataService.generalSetupTable.pmIn];
                            record.pmOut = row[DataService.generalSetupTable.pmOut];
                            record.regularHours = row[DataService.generalSetupTable.regularHours];
                            record.paySchedule = convertToPayScheduleString([DataService.generalSetupTable.paySchedule]);
                            record.incentivePay = row[DataService.generalSetupTable.incentivePay];
                            record.sundayIncentive = row[DataService.generalSetupTable.sundayIncentive];
                            record.overtimeFactor = row[DataService.generalSetupTable.overtimeFactor];
                            record.legalHolidayFactor = row[DataService.generalSetupTable.legalHolidayFactor];
                            record.specialHolidayFactor = row[DataService.generalSetupTable.specialHolidayFactor];
                            record.sickDays = row[DataService.generalSetupTable.sickDays];
                            record.vacationDays = row[DataService.generalSetupTable.vacationDays];
                        }
                        data = angular.copy(record);
                        delay.resolve(record);
                        $rootScope.$apply();
                    }, errorHandler
                );
            });
            */
        }

        return delay.promise;
    };


    var saveData = function(record, successHandler) {
        var recordToSave = record;

        var errorOccurred = false;

        var errorHandler = function(transaction, error) {
            alert('Error saving general setup data. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        DataService.payrollDB.put(recordToSave, function(id) { console.log("ID: " + id) }, errorHandler);

        /*
        var insertFunction = function(recordToSave) {
            return function (transaction) {
                transaction.executeSql(
                    "insert into " + DataService.generalSetupTable.tableName
                        + " (" + DataService.generalSetupTable.id + ", "
                        + DataService.generalSetupTable.paydayWeekday + ", "
                        + DataService.generalSetupTable.amIn + ", "
                        + DataService.generalSetupTable.amOut + ", "
                        + DataService.generalSetupTable.pmIn + ", "
                        + DataService.generalSetupTable.pmOut + ", "
                        + DataService.generalSetupTable.regularHours + ", "
                        + DataService.generalSetupTable.paySchedule + ", "
                        + DataService.generalSetupTable.incentivePay + ", "
                        + DataService.generalSetupTable.sundayIncentive + ", "
                        + DataService.generalSetupTable.overtimeFactor + ", "
                        + DataService.generalSetupTable.legalHolidayFactor + ", "
                        + DataService.generalSetupTable.specialHolidayFactor + ", "
                        + DataService.generalSetupTable.sickDays + ", "
                        + DataService.generalSetupTable.vacationDays
                        + ") values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                    [   recordToSave.id,
                        getWeekdayIndex(recordToSave.paydayWeekday),
                        recordToSave.amIn,
                        recordToSave.amOut,
                        recordToSave.pmIn,
                        recordToSave.pmOut,
                        recordToSave.regularHours,
                        getPayScheduleIndex(recordToSave.paySchedule),
                        recordToSave.incentivePay,
                        recordToSave.sundayIncentive,
                        recordToSave.overtimeFactor,
                        recordToSave.legalHolidayFactor,
                        recordToSave.specialHolidayFactor,
                        recordToSave.sickDays,
                        recordToSave.vacationDays
                    ],
                    function () {
                    },
                    errorHandler
                );
            }
        };

        var updateFunction = function(recordToSave) {
            return function (transaction) {
                transaction.executeSql(
                    "update " + DataService.generalSetupTable.tableName
                        + " set " + DataService.generalSetupTable.paydayWeekday + " = ?, "
                        + DataService.generalSetupTable.amIn + " = ?, "
                        + DataService.generalSetupTable.amOut + " = ?, "
                        + DataService.generalSetupTable.pmIn + " = ?, "
                        + DataService.generalSetupTable.pmOut + " = ?, "
                        + DataService.generalSetupTable.regularHours + " = ?, "
                        + DataService.generalSetupTable.paySchedule + " = ?, "
                        + DataService.generalSetupTable.incentivePay + " = ?, "
                        + DataService.generalSetupTable.sundayIncentive + " = ?, "
                        + DataService.generalSetupTable.overtimeFactor + " = ?, "
                        + DataService.generalSetupTable.legalHolidayFactor + " = ?, "
                        + DataService.generalSetupTable.specialHolidayFactor + " = ?, "
                        + DataService.generalSetupTable.sickDays + " = ?, "
                        + DataService.generalSetupTable.vacationDays + " = ? "
                        + "where " + DataService.generalSetupTable.id + " = ?;",
                    [getWeekdayIndex(recordToSave.paydayWeekday),
                        recordToSave.amIn,
                        recordToSave.amOut,
                        recordToSave.pmIn,
                        recordToSave.pmOut,
                        recordToSave.regularHours,
                        getPayScheduleIndex(recordToSave.paySchedule),
                        recordToSave.incentivePay,
                        recordToSave.sundayIncentive,
                        recordToSave.overtimeFactor,
                        recordToSave.legalHolidayFactor,
                        recordToSave.specialHolidayFactor,
                        recordToSave.sickDays,
                        recordToSave.vacationDays,
                        recordToSave.id],
                    function () {
                    },
                    errorHandler
                );
            }
        };

        if (recordToSave.id == 0) {
            recordToSave.id = 1;
            DataService.exec(insertFunction(recordToSave));
        } else {
            DataService.exec(updateFunction(recordToSave));
        }
        */

        data = angular.copy(record);
        if (successHandler) {
            successHandler();
        }
    };


    return {
        getData: getData,
        saveData: saveData
    }


}

