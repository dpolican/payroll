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

