/**
 * Created by Domingo Polican on 10/6/13.
 */
function EmployeeRepository(DataService, $q, $rootScope) {

    var employees;

    var getUpdatedEmployees = function() {
        return employees;
    };

    var getAll = function() {
        var delay = $q.defer();
        var errorHandler = function(error) {
            delay.reject('Error retrieving employee records. Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };
        var successHandler = function (result) {
            var records = [];
            for (var i = 0; i < result.length; i++) {
                records.push(result[i]);
            }

            employees = angular.copy(records);
            delay.resolve(records);
            //if(!$rootScope.$$phase) { $rootScope.$digest(); }
        };

        if (employees) {
            delay.resolve(angular.copy(employees));
        } else if (DataService.employeeDbReady) {
            DataService.employeeDB.getAll(successHandler, errorHandler);
        } else {
            setTimeout(function() {
                this.getAll(successHandler, errorHandler);
            }.bind(this), 100);
        }

        return delay.promise;
    };

    var saveAll = function(updatedRecords, successHandler) {
        if (!updatedRecords || angular.equals(updatedRecords, employees)) { return; }
        var recordsToSave = updatedRecords;
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(error) {
            alert('Error saving employee records. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            ids.push(recordToSave.id);
            DataService.employeeDB.put(recordToSave, function(id) { console.log("ID: " + id) }, errorHandler);
        };

        angular.forEach(employees, function(employee, index) {
            if (ids.indexOf(employee.id) < 0) {
                DataService.employeeDB.remove(employee.id, function() {}, errorHandler);
            }
        });

        employees = angular.copy(updatedRecords);
        if (successHandler) {
            successHandler();
        }
    };

    return {
        saveAll: saveAll,
        getAll: getAll
    }
};

function EmployeeController($scope, $rootScope, dialog, EmployeeRepository, StoreRepository, WithholdingTypesRepository, GeneralSetupRepository) {

    var today = new Date();
    $scope.records = [];
    $scope.record;
    $scope.stores = [];
    $scope.withholdingTypes = [];
    $scope.setup = {};

    StoreRepository.getStores()
        .then(function(result){
            $scope.stores = result;
        }, function() { alert("Error loading Stores data for Employee page.")});

    WithholdingTypesRepository.getAll()
        .then(function(result){
            $scope.withholdingTypes = result;
        }, function() { alert("Error loading Withholding Types data for Employee page.")});

    GeneralSetupRepository.getData()
        .then(function(result){
            $scope.setup = result;
        }, function() { alert("Error loading General Setup data.")})

    EmployeeRepository.getAll()
        .then(function(result){
            result.sort(function(a, b) {
                return (a.lastName < b.lastName) ? -1 : ((a.lastName > b.lastName) ? 1 : (a.firstName < b.firstName) ? -1 : 1);
            });
            $scope.records = result;
            if ($scope.records.length > 0) { $scope.record = $scope.records[0]; }
            if(!$scope.$$phase) { $scope.$apply(); }
        }, function() { alert("Error loading Employee data.")});

    $scope.determineNextId = function () {
        var max = 0;

        for (var i = 0; i < $scope.records.length; i++)
        {
            if (max < $scope.records[i].id)
            {
                max = $scope.records[i].id;
            }
        }

        return 1 + max;
    };

    $scope.gotoFirst = function() {
        if ($scope.records.length > 0) {
            $scope.record = $scope.records[0];
        }
    };

    $scope.gotoPrevious = function() {
        if ($scope.records.length > 0) {
            var index = $scope.records.indexOf($scope.record);
            if (index > 0) {
                $scope.record = $scope.records[index - 1];
            }
        }
    };

    $scope.gotoNext = function() {
        if ($scope.records.length > 0) {
            var index = $scope.records.indexOf($scope.record);
            if (index < ($scope.records.length - 1)) {
                $scope.record = $scope.records[index + 1];
            }
        }
    };


    $scope.gotoLast = function() {
        if ($scope.records.length > 0) {
            $scope.record = $scope.records[$scope.records.length - 1];
        }
    };
    $scope.add = function() {
        var newrecord = { lastName: 'Lastname', firstName: 'Firstname', active: true, loans: [] };
        newrecord.id = $scope.determineNextId();

        $scope.records.push(newrecord);
        $scope.record = newrecord;
    };

    $scope.deleteEmployee = function() {
        var index = $scope.records.indexOf($scope.record);
        if (index > -1) {
            $scope.records.splice(index, 1);

            if (index < $scope.records.length) {
                $scope.record = $scope.records[index];
            } else if ($scope.records.length > 0) {
                $scope.record = $scope.records[0];
            } else {
                $scope.record = null;
            }
        }
    };

    $scope.determineNextLoanId = function (loans) {
        var max = 0;

        for (var i = 0; i < loans.length; i++) {
            if (max < loans[i].id) {
                max = loans[i].id;
            }
        }

        return 1 + max;
    };

    $scope.restoreDefaults = function() {
        if ($scope.record && $scope.setup) {
            $scope.record.amIn = $scope.setup.amIn;
            $scope.record.amOut = $scope.setup.amOut;
            $scope.record.pmIn = $scope.setup.pmIn;
            $scope.record.pmOut = $scope.setup.pmOut;
            $scope.record.sickDays = $scope.setup.sickDays;
            $scope.record.vacationDays = $scope.setup.vacationDays;
            $scope.record.hasIncentive = ($scope.setup.incentivePay > 0);
            $scope.record.incentivePay = $scope.setup.incentivePay;

            $scope.record.hasSundayIncentive = ($scope.setup.sundayIncentive > 0);
            $scope.record.sundayIncentivePay = $scope.setup.sundayIncentive;
        }
    };
    $scope.addLoan = function() {
        if ($scope.record) {
            var loans = $scope.record.loans;
            if (!loans) { loans = []; }
            var newLoan = {};
            newLoan.id = $scope.determineNextLoanId(loans);
            loans.push(newLoan);
            $scope.record.loans = loans;
        }
    };

    $scope.deleteLoan = function(loan) {
        if ($scope.record) {
            var loanIndex = $scope.record.loans.indexOf(loan);
            if (loanIndex > -1) {
                $scope.record.loans.splice(loanIndex, 1);
            }
        }
    };

    $scope.calculateEndDate = function(loan) {
        if (loan.startDate && loan.numberOfPayments) {
            var startDate = new Date(Date.parse(loan.startDate));
            var endDate = new Date();
            endDate.setTime(startDate.getTime());
            endDate.setDate(startDate.getDate() + (loan.numberOfPayments * 7));
            loan.endDate = endDate;
            return endDate;
        }

        return null;
    };

    $scope.calculatePayment = function(loan) {
        if (loan.amount && loan.numberOfPayments && loan.apr) {
            var payment = (loan.amount * (1  + (loan.numberOfPayments / 52 * loan.apr))) / loan.numberOfPayments;
            loan.payment = payment;
            return payment;
        }
        return null;
    };

    $scope.save = function() {
        var maxId = $scope.determineNextId();
        angular.forEach($scope.records, function(record) {
            if (!record.id) {
                record.id = maxId++;
            }
        });
        EmployeeRepository.saveAll($scope.records, function() {
            $rootScope.$broadcast(PayrollConstants.employeeUpdatedEvent);
        });
        dialog.close();
    };

    $scope.cancel = function () {
        dialog.close();
    };
};